/// <reference path="../pb_data/types.d.ts" />

// Custom CLI commands:
//   ./pocketbase create-admin <email> <password>   create/reset an admin (role: admin)
//   ./pocketbase seed [force]                      load demo data
//   ./pocketbase wipe                              delete all projects + activity

$app.rootCmd.addCommand(new Command({
  use: "create-admin",
  short: "Create (or reset the password of) the single dashboard admin user",
  run: (cmd, args) => {
    const [email, password] = args
    if (!email || !password || password.length < 8) {
      console.log("Usage: ./pocketbase create-admin <email> <password>   (password: 8+ chars)")
      return
    }
    const users = $app.findCollectionByNameOrId("users")
    let user
    try {
      user = $app.findAuthRecordByEmail("users", email)
      console.log(`User ${email} exists — resetting password.`)
    } catch (_) {
      user = new Record(users)
      user.setEmail(email)
    }
    user.setPassword(password)
    user.setVerified(true)
    user.set("role", "admin")
    $app.save(user)

    const others = $app.countRecords("users", $dbx.not($dbx.hashExp({ email })))
    if (others > 0) {
      console.log(`Warning: ${others} other user(s) exist and can also edit the dashboard.`)
    }
    console.log(`Admin ready: ${email}`)
  },
}))

$app.rootCmd.addCommand(new Command({
  use: "seed",
  short: "Load demo projects + backdated activity (pass 'force' to wipe existing projects first)",
  run: (cmd, args) => {
    const lib = require(`${__hooks}/lib/seed.js`)
    const existing = $app.countRecords("projects")
    if (existing > 0 && args[0] !== "force") {
      console.log(`${existing} project(s) already exist. Run "./pocketbase seed force" to replace them.`)
      return
    }
    $app.runInTransaction((tx) => {
      lib.wipe(tx)
      console.log(`Seeded ${lib.seed(tx)} projects.`)
    })
  },
}))

$app.rootCmd.addCommand(new Command({
  use: "wipe",
  short: "Delete ALL projects and activity_log entries (statuses + settings are kept)",
  run: () => {
    require(`${__hooks}/lib/seed.js`).wipe($app)
    console.log("All projects and activity deleted.")
  },
}))
