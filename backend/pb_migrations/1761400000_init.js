/// <reference path="../pb_data/types.d.ts" />

// Initial schema: statuses, projects, activity_log, settings + access rules.
migrate((app) => {
  // Only records from the `users` auth collection may write.
  // (Superusers bypass rules entirely.)
  const AUTH = '@request.auth.collectionName = "users"'

  // Read access for the public, read-only share view:
  // allowed when sharing is on and ?token=... matches settings.share_token.
  const SHARE =
    '(@request.query.token != "" && ' +
    '@collection.settings.share_enabled ?= true && ' +
    '@collection.settings.share_token ?= @request.query.token)'
  const READ = `${AUTH} || ${SHARE}`

  const timestamps = [
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ]

  // --- users: lock down public sign-up ------------------------------------
  const users = app.findCollectionByNameOrId("users")
  users.createRule = null
  app.save(users)

  // --- settings (single record) -------------------------------------------
  // Created first because the other collections' rules reference it.
  const settings = new Collection({
    type: "base",
    name: "settings",
    listRule: `${AUTH} || (@request.query.token != "" && share_enabled = true && share_token = @request.query.token)`,
    viewRule: `${AUTH} || (@request.query.token != "" && share_enabled = true && share_token = @request.query.token)`,
    createRule: null, // single record, created below
    updateRule: AUTH,
    deleteRule: null,
    fields: [
      { name: "dashboard_title", type: "text", max: 120 },
      { name: "company_name", type: "text", max: 120 },
      {
        name: "logo",
        type: "file",
        maxSelect: 1,
        maxSize: 2 * 1024 * 1024,
        mimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
      },
      { name: "share_enabled", type: "bool" },
      { name: "share_token", type: "text", max: 128 },
      ...timestamps,
    ],
  })
  app.save(settings)

  // --- statuses -------------------------------------------------------------
  const statuses = new Collection({
    type: "base",
    name: "statuses",
    listRule: READ,
    viewRule: READ,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: AUTH,
    fields: [
      { name: "name", type: "text", required: true, max: 50 },
      { name: "color", type: "text", pattern: "^#[0-9A-Fa-f]{6}$" },
      { name: "order", type: "number", onlyInt: true },
      { name: "is_done", type: "bool" },
      ...timestamps,
    ],
  })
  app.save(statuses)

  // --- projects -------------------------------------------------------------
  const projects = new Collection({
    type: "base",
    name: "projects",
    listRule: READ,
    viewRule: READ,
    createRule: AUTH,
    updateRule: AUTH,
    deleteRule: AUTH,
    fields: [
      { name: "name", type: "text", required: true, max: 200 },
      { name: "client", type: "text", max: 120 },
      { name: "description", type: "editor" },
      // Required + no cascade: PocketBase refuses to delete a status
      // that projects still point to.
      {
        name: "status",
        type: "relation",
        required: true,
        collectionId: statuses.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "progress", type: "number", min: 0, max: 100, onlyInt: true },
      { name: "priority", type: "select", maxSelect: 1, values: ["low", "medium", "high"] },
      { name: "start_date", type: "date" },
      { name: "due_date", type: "date" },
      { name: "order", type: "number" },
      { name: "color", type: "text", max: 20 },
      ...timestamps,
    ],
    indexes: [
      "CREATE INDEX idx_projects_status_order ON projects (status, `order`)",
    ],
  })
  app.save(projects)

  // --- activity_log (written by pb_hooks only) ------------------------------
  const activity = new Collection({
    type: "base",
    name: "activity_log",
    listRule: READ,
    viewRule: READ,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "project",
        type: "relation",
        required: true,
        collectionId: projects.id,
        maxSelect: 1,
        cascadeDelete: true,
      },
      // Optional relations: cleared automatically if the status is deleted.
      { name: "from_status", type: "relation", collectionId: statuses.id, maxSelect: 1 },
      { name: "to_status", type: "relation", collectionId: statuses.id, maxSelect: 1 },
      { name: "progress", type: "number", min: 0, max: 100, onlyInt: true },
      // True when this change moved the project INTO a "done" status.
      // Snapshot, so history is stable if is_done flags change later.
      { name: "completed", type: "bool" },
      // Event time. A plain date (not autodate) so seed data can be backdated.
      { name: "at", type: "date", required: true },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: ["CREATE INDEX idx_activity_at ON activity_log (at)"],
  })
  app.save(activity)

  // --- default data ---------------------------------------------------------
  const defaults = [
    { name: "To-Do", color: "#A9B4BE", order: 0, is_done: false },
    { name: "In-Progress", color: "#7EA6D3", order: 1, is_done: false },
    { name: "Review", color: "#E2B56C", order: 2, is_done: false },
    { name: "Complete", color: "#6DAE91", order: 3, is_done: true },
  ]
  for (const s of defaults) {
    const r = new Record(statuses)
    r.load(s)
    app.save(r)
  }

  const s = new Record(settings)
  s.load({
    dashboard_title: "Project Progress",
    company_name: "",
    share_enabled: false,
    share_token: "",
  })
  app.save(s)
}, (app) => {
  for (const name of ["activity_log", "projects", "statuses", "settings"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch (_) {}
  }
  const users = app.findCollectionByNameOrId("users")
  users.createRule = ""
  app.save(users)
})
