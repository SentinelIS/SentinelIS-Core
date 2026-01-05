// admin role
db.createRole({
  role: "admin",
  privileges: [
    {
      resource: { db: "myapp_mongo", collection: "assets" },
      actions: [ "find", "insert", "update", "remove" ]
    }
  ],
  roles: [
    { role: "dbAdmin", db: "myapp_mongo" }
  ]
})

// employee role
db.createRole({
  role: "employee",
  privileges: [
    {
      resource: { db: "myapp_mongo", collection: "assets" },
      actions: [ "find", "insert" ]
    }
  ],
  roles: []
})

// admin user
db.createUser({
  user: "adminUser",
  pwd: "secureAdminPwd",
  roles: [
    { role: "admin", db: "myapp_mongo" }
  ]
})

// employee user
db.createUser({
  user: "employeeUser",
  pwd: "secureEmployeePwd",
  roles: [
    { role: "employee", db: "myapp_mongo" }
  ]
})
