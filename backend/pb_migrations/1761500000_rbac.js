/// <reference path="../pb_data/types.d.ts" />

// Role-based access: every user is an admin, editor or viewer.
//   admin  - everything, plus statuses, branding/share link and the team
//   editor - create, edit and move projects (no deleting, no settings)
//   viewer - read only
// Rules are enforced here, server-side; the UI only hides what a role cannot do.
migrate((app) => {
  const AUTH = '@request.auth.collectionName = "users"'
  const ADMIN = `${AUTH} && @request.auth.role = "admin"`
  const EDITOR = `${AUTH} && (@request.auth.role = "admin" || @request.auth.role = "editor")`

  // --- users: a role field, existing users become admins ------------------
  const users = app.findCollectionByNameOrId("users")
  users.fields.add(new SelectField({
    name: "role",
    required: true,
    maxSelect: 1,
    values: ["admin", "editor", "viewer"],
  }))
  // Admins see and manage the team; everyone else sees only themselves.
  users.listRule = `${ADMIN} || id = @request.auth.id`
  users.viewRule = `${ADMIN} || id = @request.auth.id`
  users.createRule = ADMIN
  // Users may edit their own profile but never their own role.
  users.updateRule = `${ADMIN} || (id = @request.auth.id && @request.body.role:isset = false)`
  users.deleteRule = `${ADMIN} && id != @request.auth.id`
  // Lets admins set another user's password/email without the old password.
  users.manageRule = ADMIN
  app.save(users)

  for (const u of app.findAllRecords("users")) {
    u.set("role", "admin")
    app.saveNoValidate(u)
  }

  // --- data collections ----------------------------------------------------
  const settings = app.findCollectionByNameOrId("settings")
  settings.updateRule = ADMIN
  app.save(settings)

  const statuses = app.findCollectionByNameOrId("statuses")
  statuses.createRule = ADMIN
  statuses.updateRule = ADMIN
  statuses.deleteRule = ADMIN
  app.save(statuses)

  const projects = app.findCollectionByNameOrId("projects")
  projects.createRule = EDITOR
  projects.updateRule = EDITOR
  projects.deleteRule = ADMIN
  app.save(projects)
}, (app) => {
  const AUTH = '@request.auth.collectionName = "users"'

  const users = app.findCollectionByNameOrId("users")
  users.fields.removeByName("role")
  users.listRule = "id = @request.auth.id"
  users.viewRule = "id = @request.auth.id"
  users.createRule = null
  users.updateRule = "id = @request.auth.id"
  users.deleteRule = "id = @request.auth.id"
  users.manageRule = null
  app.save(users)

  const settings = app.findCollectionByNameOrId("settings")
  settings.updateRule = AUTH
  app.save(settings)

  for (const name of ["statuses", "projects"]) {
    const c = app.findCollectionByNameOrId(name)
    c.createRule = AUTH
    c.updateRule = AUTH
    c.deleteRule = AUTH
    app.save(c)
  }
})
