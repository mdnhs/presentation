/// <reference path="../pb_data/types.d.ts" />

// Support: clients open tickets from the portal; the team answers them.
//   tickets          one per request, owned by a client, optionally about one of its projects
//   ticket_messages  the conversation; `internal` notes are staff-only and never reach a client
//   ticket_reads     when each user last read each ticket (unread badges)
// Who may do what:
//   client logins  see and open tickets for their own client, reply (never internal), resolve/reopen
//   staff viewers  read everything, change nothing
//   editors/admins read and answer everything, set status/priority/assignee; admins may delete
// pb_hooks/support.pb.js fills in author/creator, checks a client only touches its own tickets
// and keeps last_message_at / last_author / status in step with the conversation.
const AUTH = '@request.auth.collectionName = "users"'
const ACTIVE = `${AUTH} && @request.auth.suspended = false`
const STAFF = `${ACTIVE} && @request.auth.client = ""`
const EDITOR = `${STAFF} && (@request.auth.role = "admin" || @request.auth.role = "editor")`
const ADMIN = `${STAFF} && @request.auth.role = "admin"`
const CLIENT = `${ACTIVE} && @request.auth.client != ""`

migrate((app) => {
  const users = app.findCollectionByNameOrId("users")
  const clients = app.findCollectionByNameOrId("clients")
  const projects = app.findCollectionByNameOrId("projects")
  const files = (name) => ({
    name,
    type: "file",
    maxSelect: 5,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [
      "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv",
      "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  })
  const timestamps = [
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ]

  const tickets = new Collection({
    type: "base",
    name: "tickets",
    listRule: `${STAFF} || (${CLIENT} && client = @request.auth.client)`,
    viewRule: `${STAFF} || (${CLIENT} && client = @request.auth.client)`,
    createRule: `${EDITOR} || (${CLIENT} && @request.body.client = @request.auth.client)`,
    // A client may only resolve or reopen its own ticket.
    updateRule:
      `${EDITOR} || (${CLIENT} && client = @request.auth.client && ` +
      `@request.body.subject:isset = false && @request.body.description:isset = false && ` +
      `@request.body.client:isset = false && @request.body.project:isset = false && ` +
      `@request.body.priority:isset = false && @request.body.assignee:isset = false && ` +
      `(@request.body.status = "resolved" || @request.body.status = "open"))`,
    deleteRule: ADMIN,
    fields: [
      { name: "subject", type: "text", required: true, max: 200 },
      { name: "description", type: "text", max: 10000 },
      { name: "client", type: "relation", required: true, collectionId: clients.id, maxSelect: 1, cascadeDelete: true },
      { name: "project", type: "relation", collectionId: projects.id, maxSelect: 1 },
      { name: "status", type: "select", required: true, maxSelect: 1, values: ["open", "in_progress", "waiting", "resolved"] },
      { name: "priority", type: "select", required: true, maxSelect: 1, values: ["low", "normal", "high", "urgent"] },
      { name: "assignee", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "created_by", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "last_author", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "last_message_at", type: "date" },
      files("attachments"),
      ...timestamps,
    ],
    indexes: [
      "CREATE INDEX idx_tickets_client ON tickets (client)",
      "CREATE INDEX idx_tickets_last ON tickets (last_message_at)",
    ],
  })
  app.save(tickets)

  const messages = new Collection({
    type: "base",
    name: "ticket_messages",
    listRule: `${STAFF} || (${CLIENT} && ticket.client = @request.auth.client && internal = false)`,
    viewRule: `${STAFF} || (${CLIENT} && ticket.client = @request.auth.client && internal = false)`,
    // Clients never post internal notes; the hook checks the ticket is theirs.
    createRule: `${EDITOR} || (${CLIENT} && (@request.body.internal:isset = false || @request.body.internal = false))`,
    updateRule: null,
    deleteRule: ADMIN,
    fields: [
      { name: "ticket", type: "relation", required: true, collectionId: tickets.id, maxSelect: 1, cascadeDelete: true },
      { name: "author", type: "relation", collectionId: users.id, maxSelect: 1 },
      { name: "body", type: "text", max: 10000 },
      { name: "internal", type: "bool" },
      files("attachments"),
      ...timestamps,
    ],
    indexes: ["CREATE INDEX idx_ticket_messages_ticket ON ticket_messages (ticket, created)"],
  })
  app.save(messages)

  const SELF = `${ACTIVE} && user = @request.auth.id`
  const reads = new Collection({
    type: "base",
    name: "ticket_reads",
    listRule: SELF,
    viewRule: SELF,
    createRule: `${ACTIVE} && @request.body.user = @request.auth.id`,
    updateRule: `${SELF} && (@request.body.user:isset = false || @request.body.user = @request.auth.id)`,
    deleteRule: SELF,
    fields: [
      { name: "ticket", type: "relation", required: true, collectionId: tickets.id, maxSelect: 1, cascadeDelete: true },
      { name: "user", type: "relation", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { name: "at", type: "date", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_ticket_reads ON ticket_reads (ticket, user)"],
  })
  app.save(reads)
}, (app) => {
  for (const name of ["ticket_reads", "ticket_messages", "tickets"]) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch (_) {}
  }
})
