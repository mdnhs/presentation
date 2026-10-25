/// <reference path="../pb_data/types.d.ts" />

// Support tickets: what the access rules can't express (see pb_migrations/1761800000_support.js).

// New ticket: stamp the creator; a client's ticket is always its own, open and unassigned,
// and may only point at one of its own projects.
onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) throw new ForbiddenError()
  const lib = require(`${__hooks}/lib/support.js`)

  e.record.set("created_by", auth.id)
  e.record.set("last_author", auth.id)
  e.record.set("last_message_at", new DateTime())
  if (!e.record.getString("priority")) e.record.set("priority", "normal")

  if (auth.getString("client")) {
    e.record.set("client", auth.getString("client"))
    e.record.set("status", "open")
    e.record.set("assignee", "")
  } else if (!e.record.getString("status")) {
    e.record.set("status", "open")
  }
  lib.assertProjectBelongs(e.app, e.record)
  e.next()
}, "tickets")

onRecordUpdateRequest((e) => {
  require(`${__hooks}/lib/support.js`).assertProjectBelongs(e.app, e.record)
  e.next()
}, "tickets")

// New message: stamp the author; clients only write on their own tickets and never internally.
onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) throw new ForbiddenError()
  const ticket = e.app.findRecordById("tickets", e.record.getString("ticket"))
  const client = auth.getString("client")
  if (client && ticket.getString("client") !== client) throw new ForbiddenError()
  if (client) e.record.set("internal", false)
  if (!e.record.getString("body").trim() && e.record.getStringSlice("attachments").length === 0) {
    throw new BadRequestError("Write a message or attach a file.")
  }
  e.record.set("author", auth.id)
  e.next()
}, "ticket_messages")

// Keep the ticket in step with its conversation (internal notes don't count as activity for clients):
// a client reply reopens a waiting/resolved ticket; a team reply to an open ticket waits on the client.
onRecordAfterCreateSuccess((e) => {
  if (e.record.getBool("internal")) return e.next()
  const ticket = e.app.findRecordById("tickets", e.record.getString("ticket"))
  const author = e.app.findRecordById("users", e.record.getString("author"))
  const fromClient = !!author.getString("client")
  const status = ticket.getString("status")

  ticket.set("last_message_at", e.record.getDateTime("created"))
  ticket.set("last_author", author.id)
  if (fromClient && (status === "waiting" || status === "resolved")) ticket.set("status", "open")
  if (!fromClient && (status === "open" || status === "in_progress")) ticket.set("status", "waiting")
  e.app.save(ticket)
  e.next()
}, "ticket_messages")
