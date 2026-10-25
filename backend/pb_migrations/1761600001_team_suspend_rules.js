/// <reference path="../pb_data/types.d.ts" />

// Follow-up to 1761600000_team_suspend.js: its rule rewrite skipped every rule, because in the
// JSVM a rule reads back as a wrapped value, not a plain JS string. Every "signed-in user" check
// now also requires an active (not suspended) account.
const AUTH = '@request.auth.collectionName = "users"'
const ACTIVE = `${AUTH} && @request.auth.suspended = false`
const COLLECTIONS = ["users", "settings", "statuses", "projects", "activity_log"]
const RULES = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule", "manageRule"]

function rewrite(app, from, to) {
  for (const name of COLLECTIONS) {
    const c = app.findCollectionByNameOrId(name)
    for (const rule of RULES) {
      const v = c[rule]
      if (v === null || v === undefined) continue // locked rule (superusers only)
      const s = String(v)
      if (s.includes(from) && (from === ACTIVE || !s.includes(ACTIVE))) c[rule] = s.split(from).join(to)
    }
    app.save(c)
  }
}

migrate((app) => rewrite(app, AUTH, ACTIVE), (app) => rewrite(app, ACTIVE, AUTH))
