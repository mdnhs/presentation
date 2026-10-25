/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for activity_log. Loaded via require() from hook handlers
// (JSVM handlers can't see top-level variables of their own file).

function isDone(app, statusId) {
  if (!statusId) return false
  try {
    return app.findRecordById("statuses", statusId).getBool("is_done")
  } catch (_) {
    return false
  }
}

/**
 * Writes one activity_log entry for `project`.
 * @param {core.App} app
 * @param {core.Record} project  the saved project
 * @param {string} fromStatus    previous status id ("" for new projects)
 * @param {Date} [at]            event time, defaults to now
 */
function log(app, project, fromStatus, at) {
  const toStatus = project.getString("status")
  const entry = new Record(app.findCollectionByNameOrId("activity_log"))
  entry.set("project", project.id)
  entry.set("from_status", fromStatus || "")
  entry.set("to_status", toStatus)
  entry.set("progress", project.getInt("progress"))
  entry.set("completed", toStatus !== fromStatus && isDone(app, toStatus) && !isDone(app, fromStatus))
  entry.set("at", (at || new Date()).toISOString())
  app.save(entry)
}

module.exports = { log, isDone }
