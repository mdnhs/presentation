import { pb } from '../pb.js'
import { auth } from './auth.svelte.js'

// Support tickets for the signed-in user, kept live via realtime. The server decides what each
// user sees (backend/pb_migrations/1761800000_support.js): a client login gets only its own
// tickets and never internal notes; staff get everything.

export const STATUSES = {
  open: { label: 'Open', tone: 'bg-[oklch(95%_0.04_250)] text-[oklch(45%_0.1_250)]' },
  in_progress: { label: 'In progress', tone: 'bg-warn/20 text-ink-2' },
  waiting: { label: 'Waiting on client', tone: 'bg-paper-3 text-ink-2' },
  resolved: { label: 'Resolved', tone: 'bg-mint text-brand-2' },
}
export const PRIORITIES = {
  low: { label: 'Low', tone: 'bg-paper-3 text-muted-foreground' },
  normal: { label: 'Normal', tone: 'bg-paper-2 text-ink-2' },
  high: { label: 'High', tone: 'bg-warn/25 text-ink-2' },
  urgent: { label: 'Urgent', tone: 'bg-error/12 text-error' },
}

const EXPAND = 'client,project,assignee,last_author,created_by'

class SupportStore {
  tickets = $state([])
  reads = $state({}) // ticketId -> { id, at }
  loading = $state(true)

  #unsubs = []
  #started = false

  /** Has someone else written since I last opened this ticket? */
  isUnread(t) {
    if (!t.last_message_at || t.last_author === auth.user?.id) return false
    const read = this.reads[t.id]?.at
    return !read || read < t.last_message_at
  }

  unreadCount = $derived(this.tickets.filter((t) => this.isUnread(t)).length)
  openCount = $derived(this.tickets.filter((t) => t.status !== 'resolved').length)

  async start() {
    if (this.#started) return
    this.#started = true
    this.loading = true
    try {
      const [tickets, reads] = await Promise.all([
        pb.collection('tickets').getFullList({ sort: '-last_message_at', expand: EXPAND }),
        pb.collection('ticket_reads').getFullList(),
      ])
      this.tickets = tickets
      this.reads = Object.fromEntries(reads.map((r) => [r.ticket, { id: r.id, at: r.at }]))
      this.#unsubs.push(await pb.collection('tickets').subscribe('*', (e) => this.#apply(e), { expand: EXPAND }))
    } catch (_) {
      // Support is optional chrome: a failure here must not break the rest of the app.
    } finally {
      this.loading = false
    }
  }

  async stop() {
    for (const unsub of this.#unsubs) await unsub().catch(() => {})
    this.#unsubs = []
    this.#started = false
    this.tickets = []
    this.reads = {}
  }

  #apply({ action, record }) {
    const i = this.tickets.findIndex((t) => t.id === record.id)
    if (action === 'delete') {
      if (i >= 0) this.tickets.splice(i, 1)
    } else if (i >= 0) {
      this.tickets[i] = record
    } else {
      this.tickets.unshift(record)
    }
    this.tickets.sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''))
  }

  /** data: { subject, description, client, project, priority, attachments: File[] } */
  async create(data) {
    const form = new FormData()
    for (const [k, v] of Object.entries(data)) {
      if (k === 'attachments') for (const f of v ?? []) form.append('attachments', f)
      else if (v !== undefined && v !== null) form.append(k, v)
    }
    const record = await pb.collection('tickets').create(form, { expand: EXPAND })
    this.#apply({ action: 'create', record })
    return record
  }

  async update(id, patch) {
    const record = await pb.collection('tickets').update(id, patch, { expand: EXPAND })
    this.#apply({ action: 'update', record })
    return record
  }

  remove(id) {
    return pb.collection('tickets').delete(id)
  }

  messages(ticketId) {
    return pb.collection('ticket_messages').getFullList({ filter: pb.filter('ticket = {:id}', { id: ticketId }), sort: 'created', expand: 'author' })
  }

  /** Live messages for one ticket; returns the unsubscribe function. */
  watchMessages(ticketId, onMessage) {
    return pb.collection('ticket_messages').subscribe('*', (e) => e.record.ticket === ticketId && onMessage(e), { expand: 'author' })
  }

  send(ticketId, { body, internal = false, files = [] }) {
    const form = new FormData()
    form.append('ticket', ticketId)
    form.append('body', body)
    form.append('internal', internal ? 'true' : 'false')
    for (const f of files) form.append('attachments', f)
    return pb.collection('ticket_messages').create(form, { expand: 'author' })
  }

  /** Marks a ticket read up to now (one ticket_reads row per user and ticket). */
  async markRead(ticket) {
    if (!auth.user || !this.isUnread(ticket)) return
    const at = new Date().toISOString().replace('T', ' ')
    const current = this.reads[ticket.id]
    this.reads[ticket.id] = { id: current?.id, at }
    try {
      const rec = current?.id
        ? await pb.collection('ticket_reads').update(current.id, { at })
        : await pb.collection('ticket_reads').create({ ticket: ticket.id, user: auth.user.id, at })
      this.reads[ticket.id] = { id: rec.id, at: rec.at }
    } catch (_) {
      // Read state is a convenience; never surface its failures.
    }
  }
}

export const support = new SupportStore()

/** File URL for a ticket or message attachment. */
export const fileUrl = (record, name) => pb.files.getURL(record, name)
