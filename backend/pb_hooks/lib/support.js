/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for support hooks (JSVM handlers can't see top-level variables of their own file).

/** A ticket's project must belong to the ticket's client (projects match clients by name). */
function assertProjectBelongs(app, ticket) {
  const projectId = ticket.getString("project")
  if (!projectId) return
  const project = app.findRecordById("projects", projectId)
  const client = app.findRecordById("clients", ticket.getString("client"))
  if (project.getString("client") !== client.getString("name")) {
    throw new BadRequestError("That project belongs to another client.")
  }
}

module.exports = { assertProjectBelongs }
