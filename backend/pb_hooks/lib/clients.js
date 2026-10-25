/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for clients (JSVM handlers can't see top-level variables of their own file).

/** Creates a client record for `name` unless one already exists. */
function ensure(app, name) {
  name = (name || "").trim()
  if (!name) return
  try {
    app.findFirstRecordByData("clients", "name", name)
  } catch (_) {
    const r = new Record(app.findCollectionByNameOrId("clients"))
    r.set("name", name)
    app.save(r)
  }
}

/** Projects whose `client` text is `name`. */
function projectsOf(app, name) {
  return app.findRecordsByFilter("projects", "client = {:name}", "", 0, 0, { name })
}

module.exports = { ensure, projectsOf }
