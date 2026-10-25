/// <reference path="../pb_data/types.d.ts" />

// Clients: contact details per client. Projects keep their plain-text `client` field and
// match a client by name; pb_hooks/clients.pb.js keeps the two in sync.
migrate((app) => {
  const AUTH = '@request.auth.collectionName = "users"'
  const ADMIN = `${AUTH} && @request.auth.role = "admin"`
  const EDITOR = `${AUTH} && (@request.auth.role = "admin" || @request.auth.role = "editor")`

  const clients = new Collection({
    type: "base",
    name: "clients",
    // Signed-in users only: the public share view never sees contact details.
    listRule: AUTH,
    viewRule: AUTH,
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: ADMIN,
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "contact_name", type: "text", max: 120 },
      { name: "email", type: "email" },
      { name: "phone", type: "text", max: 40 },
      { name: "website", type: "url" },
      { name: "address", type: "text", max: 300 },
      { name: "notes", type: "text", max: 5000 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_clients_name ON clients (name)"],
  })
  app.save(clients)

  // One client per name already used on a project.
  const names = new Set(app.findAllRecords("projects").map((p) => p.getString("client").trim()).filter(Boolean))
  for (const name of names) {
    const r = new Record(clients)
    r.set("name", name)
    app.save(r)
  }
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("clients"))
  } catch (_) {}
})
