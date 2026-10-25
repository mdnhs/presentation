/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for role checks (JSVM handlers can't see top-level variables of their own file).

/** Number of admins who are not suspended. */
function activeAdminCount(app) {
  return app.countRecords("users", $dbx.hashExp({ role: "admin", suspended: false }))
}

/** Client logins (users with a client) may only ever be viewers. */
function assertClientIsViewer(record) {
  if (record.getString("client") && record.getString("role") !== "viewer") {
    throw new BadRequestError("A client login always has the viewer role.")
  }
}

module.exports = { activeAdminCount, assertClientIsViewer }
