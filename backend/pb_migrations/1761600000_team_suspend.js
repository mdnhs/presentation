/// <reference path="../pb_data/types.d.ts" />

// Team: members can be suspended instead of deleted. A suspended member cannot sign in (authRule)
// and an already-issued token stops working too, because every rule now also requires an
// active account. Suspending is admin-only; nobody can suspend themselves (pb_hooks/rbac.pb.js).
migrate((app) => {
  const AUTH = '@request.auth.collectionName = "users"'
  const ACTIVE = `${AUTH} && @request.auth.suspended = false`

  const users = app.findCollectionByNameOrId("users")
  users.fields.add(new BoolField({ name: "suspended" }))
  users.authRule = "suspended = false"
  // Members may still edit their own name/password, but not their role or suspension.
  users.updateRule = users.updateRule.replace(
    "@request.body.role:isset = false",
    "@request.body.role:isset = false && @request.body.suspended:isset = false",
  )
  app.save(users)

  // Every "signed-in user" check also requires an active account.
  for (const name of ["users", "settings", "statuses", "projects", "activity_log"]) {
    const c = app.findCollectionByNameOrId(name)
    for (const rule of ["listRule", "viewRule", "createRule", "updateRule", "deleteRule", "manageRule"]) {
      if (typeof c[rule] === "string" && c[rule].includes(AUTH) && !c[rule].includes(ACTIVE)) {
        c[rule] = c[rule].split(AUTH).join(ACTIVE)
      }
    }
    app.save(c)
  }
}, (app) => {
  const AUTH = '@request.auth.collectionName = "users"'
  const ACTIVE = `${AUTH} && @request.auth.suspended = false`

  for (const name of ["users", "settings", "statuses", "projects", "activity_log"]) {
    const c = app.findCollectionByNameOrId(name)
    for (const rule of ["listRule", "viewRule", "createRule", "updateRule", "deleteRule", "manageRule"]) {
      if (typeof c[rule] === "string") c[rule] = c[rule].split(ACTIVE).join(AUTH)
    }
    app.save(c)
  }

  const users = app.findCollectionByNameOrId("users")
  users.updateRule = users.updateRule.replace(" && @request.body.suspended:isset = false", "")
  users.authRule = ""
  users.fields.removeByName("suspended")
  app.save(users)
})
