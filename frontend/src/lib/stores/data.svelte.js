import { pb, getShareToken } from '../pb.js'

const COLLECTIONS = ['statuses', 'projects', 'settings', 'activity_log']
// Signed-in only: the share view can't read client contact details.
const PRIVATE_COLLECTIONS = ['clients']
const ACTIVITY_WEEKS = 16

// Central app data. Loaded once, then kept in sync via realtime subscriptions,
// so every open tab (and the share view) updates instantly.
class DataStore {
  statuses = $state([])
  projects = $state([])
  activity = $state([])
  clientRecords = $state([])
  settings = $state(null)
  loading = $state(true)
  error = $state('')

  sortedStatuses = $derived([...this.statuses].sort((a, b) => a.order - b.order))
  statusById = $derived(Object.fromEntries(this.statuses.map((s) => [s.id, s])))
  // Client names: every client record plus any name typed on a project.
  clients = $derived(
    [...new Set([...this.clientRecords.map((c) => c.name), ...this.projects.map((p) => p.client)].filter(Boolean))].sort(),
  )

  #unsubs = []

  async start() {
    this.loading = true
    this.error = ''
    try {
      await this.load()
      await this.#subscribe()
    } catch (err) {
      this.error = err?.status === 0 ? 'Cannot reach the server.' : err?.message || 'Failed to load data.'
    } finally {
      this.loading = false
    }
  }

  async stop() {
    for (const unsub of this.#unsubs) await unsub().catch(() => {})
    this.#unsubs = []
  }

  async load() {
    const since = new Date(Date.now() - ACTIVITY_WEEKS * 7 * 864e5).toISOString().replace('T', ' ')
    const [statuses, projects, activity, settings] = await Promise.all([
      pb.collection('statuses').getFullList({ sort: 'order' }),
      pb.collection('projects').getFullList({ sort: 'order' }),
      pb.collection('activity_log').getFullList({ sort: 'at', filter: pb.filter('at >= {:since}', { since }) }),
      pb.collection('settings').getList(1, 1),
    ])
    this.statuses = statuses
    this.projects = projects
    this.activity = activity
    this.settings = settings.items[0] ?? null
    this.clientRecords = getShareToken() ? [] : await pb.collection('clients').getFullList({ sort: 'name' })
  }

  async #subscribe() {
    await this.stop()
    const token = getShareToken()
    const options = token ? { query: { token } } : undefined
    for (const name of token ? COLLECTIONS : [...COLLECTIONS, ...PRIVATE_COLLECTIONS]) {
      const unsub = await pb.collection(name).subscribe('*', (e) => this.#apply(name, e), options)
      this.#unsubs.push(unsub)
    }
  }

  #apply(name, { action, record }) {
    if (name === 'settings') {
      if (action !== 'delete') this.settings = record
      return
    }
    const key = { activity_log: 'activity', clients: 'clientRecords' }[name] ?? name
    const list = this[key]
    const i = list.findIndex((r) => r.id === record.id)
    if (action === 'delete') {
      if (i >= 0) list.splice(i, 1)
    } else if (i >= 0) {
      list[i] = record
    } else {
      list.push(record)
    }
  }

  // --- project mutations ----------------------------------------------------

  async createProject(data) {
    const record = await pb.collection('projects').create(data)
    this.#apply('projects', { action: 'create', record })
    return record
  }

  async updateProject(id, data) {
    // Optimistic: reflect the change immediately, roll back on failure.
    const i = this.projects.findIndex((p) => p.id === id)
    const before = i >= 0 ? { ...this.projects[i] } : null
    if (i >= 0) this.projects[i] = { ...this.projects[i], ...data }
    try {
      const record = await pb.collection('projects').update(id, data)
      this.#apply('projects', { action: 'update', record })
      return record
    } catch (err) {
      if (before) this.projects[i] = before
      throw err
    }
  }

  async deleteProject(id) {
    await pb.collection('projects').delete(id)
    this.#apply('projects', { action: 'delete', record: { id } })
  }

  /**
   * Persist a column's new card order (and status, for cards dropped in).
   * Only records whose status/order actually changed are sent.
   */
  async saveColumn(statusId, orderedIds) {
    const jobs = []
    orderedIds.forEach((id, order) => {
      const p = this.projects.find((x) => x.id === id)
      if (p && (p.status !== statusId || p.order !== order)) {
        jobs.push(this.updateProject(id, { status: statusId, order }))
      }
    })
    await Promise.all(jobs)
  }

  // --- status mutations -----------------------------------------------------

  async createStatus(data) {
    const order = this.statuses.length ? Math.max(...this.statuses.map((s) => s.order || 0)) + 1 : 0
    const record = await pb.collection('statuses').create({ order, ...data })
    this.#apply('statuses', { action: 'create', record })
    return record
  }

  async updateStatus(id, data) {
    const record = await pb.collection('statuses').update(id, data)
    this.#apply('statuses', { action: 'update', record })
    return record
  }

  async saveStatusOrder(orderedIds) {
    // Optimistic reorder first so the UI doesn't jump back while saving.
    orderedIds.forEach((id, order) => {
      const s = this.statuses.find((x) => x.id === id)
      if (s) s.order = order
    })
    await Promise.all(orderedIds.map((id, order) => pb.collection('statuses').update(id, { order })))
  }

  /** Deletes a status; projects still using it are moved to `moveToId` first. */
  async deleteStatus(id, moveToId) {
    const affected = this.projects.filter((p) => p.status === id)
    if (affected.length) {
      if (!moveToId) throw new Error('Move the projects in this status first.')
      await Promise.all(affected.map((p) => this.updateProject(p.id, { status: moveToId })))
    }
    await pb.collection('statuses').delete(id)
    this.#apply('statuses', { action: 'delete', record: { id } })
  }

  // --- client mutations -----------------------------------------------------

  async createClient(data) {
    const record = await pb.collection('clients').create(data)
    this.#apply('clients', { action: 'create', record })
    return record
  }

  /** Renaming a client also renames it on its projects (server hook; arrives via realtime). */
  async updateClient(id, data) {
    const record = await pb.collection('clients').update(id, data)
    this.#apply('clients', { action: 'update', record })
    return record
  }

  async deleteClient(id) {
    await pb.collection('clients').delete(id)
    this.#apply('clients', { action: 'delete', record: { id } })
  }

  // --- settings ---------------------------------------------------------------

  /** `data` may contain a File (logo) — the SDK sends multipart automatically. */
  async updateSettings(data) {
    const record = await pb.collection('settings').update(this.settings.id, data)
    this.settings = record
    return record
  }
}

export const data = new DataStore()
