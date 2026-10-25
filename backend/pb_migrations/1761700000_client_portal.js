/// <reference path="../pb_data/types.d.ts" />

// Client portal: a user can belong to a client (users.client). Such a "client login" is always a
// viewer (pb_hooks/rbac.pb.js) and sees only its own client: its projects, their activity and its
// client record. Staff (users without a client) see everything their role allows, as before.
// Editors may create and manage client logins (viewer + client only); admins manage everyone.
const AUTH = '@request.auth.collectionName = "users"'
const ACTIVE = `${AUTH} && @request.auth.suspended = false`
const ADMIN = `${ACTIVE} && @request.auth.role = "admin"`
const EDITOR = `${ACTIVE} && (@request.auth.role = "admin" || @request.auth.role = "editor")`
const SHARE =
  '(@request.query.token != "" && @collection.settings.share_enabled ?= true && @collection.settings.share_token ?= @request.query.token)'
const STAFF = '@request.auth.client = ""'
const SELF = `id = @request.auth.id && @request.auth.suspended = false && @request.body.role:isset = false && @request.body.suspended:isset = false`

migrate((app) => {
  const clients = app.findCollectionByNameOrId("clients")

  const users = app.findCollectionByNameOrId("users")
  users.fields.add(new RelationField({ name: "client", collectionId: clients.id, maxSelect: 1, cascadeDelete: true }))
  users.listRule = `${ADMIN} || id = @request.auth.id || (${EDITOR} && client != "")`
  users.viewRule = users.listRule
  users.createRule = `${ADMIN} || (${EDITOR} && @request.body.role = "viewer" && @request.body.client != "")`
  users.updateRule =
    `${ADMIN} || (${EDITOR} && client != "" && @request.body.role:isset = false && @request.body.client:isset = false) || ` +
    `(${SELF} && @request.body.client:isset = false)`
  users.deleteRule = `${ADMIN} && id != @request.auth.id`
  users.manageRule = `${ADMIN} || (${EDITOR} && client != "")`
  app.save(users)

  const projects = app.findCollectionByNameOrId("projects")
  projects.listRule = `(${ACTIVE} && (${STAFF} || client = @request.auth.client.name)) || ${SHARE}`
  projects.viewRule = projects.listRule
  app.save(projects)

  const activity = app.findCollectionByNameOrId("activity_log")
  activity.listRule = `(${ACTIVE} && (${STAFF} || project.client = @request.auth.client.name)) || ${SHARE}`
  activity.viewRule = activity.listRule
  app.save(activity)

  clients.listRule = `${ACTIVE} && (${STAFF} || id = @request.auth.client)`
  clients.viewRule = clients.listRule
  app.save(clients)
}, (app) => {
  const users = app.findCollectionByNameOrId("users")
  users.listRule = `${ADMIN} || id = @request.auth.id`
  users.viewRule = users.listRule
  users.createRule = ADMIN
  users.updateRule = `${ADMIN} || (id = @request.auth.id && @request.body.role:isset = false && @request.body.suspended:isset = false)`
  users.deleteRule = `${ADMIN} && id != @request.auth.id`
  users.manageRule = ADMIN
  users.fields.removeByName("client")
  app.save(users)

  for (const name of ["projects", "activity_log"]) {
    const c = app.findCollectionByNameOrId(name)
    c.listRule = `${ACTIVE} || ${SHARE}`
    c.viewRule = c.listRule
    app.save(c)
  }
  const clients = app.findCollectionByNameOrId("clients")
  clients.listRule = ACTIVE
  clients.viewRule = ACTIVE
  app.save(clients)
})
