/// <reference path="../pb_data/types.d.ts" />

// Suspended members lose access to clients too (same rewrite as 1761600001 for the clients collection).
const AUTH = '@request.auth.collectionName = "users"'
const ACTIVE = `${AUTH} && @request.auth.suspended = false`
const RULES = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"]

function rewrite(app, from, to) {
  const c = app.findCollectionByNameOrId("clients")
  for (const rule of RULES) {
    const v = c[rule]
    if (v === null || v === undefined) continue
    const s = String(v)
    if (s.includes(from) && (from === ACTIVE || !s.includes(ACTIVE))) c[rule] = s.split(from).join(to)
  }
  app.save(c)
}

migrate((app) => rewrite(app, AUTH, ACTIVE), (app) => rewrite(app, ACTIVE, AUTH))
