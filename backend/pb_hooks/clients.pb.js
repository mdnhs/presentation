/// <reference path="../pb_data/types.d.ts" />

// Keeps projects.client (plain text) and the clients collection in sync:
//  - a project saved with a new client name creates that client
//  - renaming a client renames it on its projects
//  - a client that still has projects cannot be deleted

onRecordCreate((e) => {
  e.next()
  require(`${__hooks}/lib/clients.js`).ensure(e.app, e.record.getString("client"))
}, "projects")

onRecordUpdate((e) => {
  e.next()
  require(`${__hooks}/lib/clients.js`).ensure(e.app, e.record.getString("client"))
}, "projects")

onRecordUpdate((e) => {
  const before = e.record.original().getString("name")
  e.next()
  const after = e.record.getString("name")
  if (before === after) return
  for (const p of require(`${__hooks}/lib/clients.js`).projectsOf(e.app, before)) {
    p.set("client", after)
    e.app.save(p)
  }
}, "clients")

onRecordDeleteRequest((e) => {
  const count = require(`${__hooks}/lib/clients.js`).projectsOf(e.app, e.record.getString("name")).length
  if (count > 0) {
    throw new BadRequestError(`This client still has ${count} project(s). Move or delete them first.`)
  }
  e.next()
}, "clients")
