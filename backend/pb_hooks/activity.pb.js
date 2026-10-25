/// <reference path="../pb_data/types.d.ts" />

// Records project status/progress changes into activity_log (feeds the trend chart).
// Using onRecordCreate/onRecordUpdate (not *AfterSuccess) so we can read the
// original values before e.next() persists the record.

onRecordCreate((e) => {
  e.next()
  require(`${__hooks}/lib/activity.js`).log(e.app, e.record, "")
}, "projects")

onRecordUpdate((e) => {
  const orig = e.record.original()
  const prevStatus = orig.getString("status")
  const prevProgress = orig.getInt("progress")

  e.next()

  const changed =
    prevStatus !== e.record.getString("status") ||
    prevProgress !== e.record.getInt("progress")
  if (changed) {
    require(`${__hooks}/lib/activity.js`).log(e.app, e.record, prevStatus)
  }
}, "projects")
