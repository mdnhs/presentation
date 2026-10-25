/// <reference path="../pb_data/types.d.ts" />

// Guards the rules can't express: the team always keeps at least one active admin,
// nobody can suspend or demote themselves by accident, and a client login is always a viewer.

onRecordCreateRequest((e) => {
  require(`${__hooks}/lib/rbac.js`).assertClientIsViewer(e.record)
  e.next()
}, "users")

onRecordUpdateRequest((e) => {
  const orig = e.record.original()
  const wasActiveAdmin = orig.getString("role") === "admin" && !orig.getBool("suspended")
  const staysActiveAdmin = e.record.getString("role") === "admin" && !e.record.getBool("suspended")
  const self = e.auth && e.auth.id === e.record.id

  require(`${__hooks}/lib/rbac.js`).assertClientIsViewer(e.record)

  if (self && e.record.getBool("suspended") && !orig.getBool("suspended")) {
    throw new BadRequestError("You cannot suspend your own account.")
  }
  if (wasActiveAdmin && !staysActiveAdmin && require(`${__hooks}/lib/rbac.js`).activeAdminCount(e.app) <= 1) {
    throw new BadRequestError("The last active admin cannot be demoted or suspended.")
  }
  e.next()
}, "users")

onRecordDeleteRequest((e) => {
  const activeAdmin = e.record.getString("role") === "admin" && !e.record.getBool("suspended")
  if (activeAdmin && require(`${__hooks}/lib/rbac.js`).activeAdminCount(e.app) <= 1) {
    throw new BadRequestError("The last active admin cannot be removed.")
  }
  e.next()
}, "users")
