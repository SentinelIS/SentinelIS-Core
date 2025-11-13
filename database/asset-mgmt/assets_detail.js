/*

{
  "_id": ObjectId("..."),
  "asset_id": 123,                                                          // Join to ASSET_MGMT.ASSET_ID (SQL)
  "name": "Mail Server",
  "type": "Server",                                                         // for example Server, Application, Device, Databese
  "description": "Central E-Mail-Server for internal Communication",
  "classification": "internal",                                             // public / inernal / top secret
  "location": "Data Center Zürich",
  "owner": "IT-Department",
  "value": "high",                                                          // Rating of Importance
  "status": "active",                                                       // active / inactive / in planning / decommissioned
  "risks": [                                                                // optinal risks
    {
      "risk_id": "RISK-001",
      "description": "Missing Power Supply and / or Backup",
      "impact": "high",
      "probability": "medium"
    }
  ],
  "controls": [                                                             // optinal security controls
    {
      "control_id": "CTRL-001",
      "description": "USV-System installed"
    }
  ],
  "last_audit": {
    "date": ISODate("2025-11-10T10:00:00Z"),
    "auditor": "John Doe",
    "result": "compliant"
  },
  "created_at": ISODate("2025-11-12T09:00:00Z"),
  "updated_at": ISODate("2025-11-12T10:15:00Z")
}

*/

db.createCollection("assets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["asset_id", "name", "type"],
      properties: {
        asset_id: {
          bsonType: "int",
          description: "Referenz zu ASSET_MGMT.ASSET_ID in MySQL"
        },
        name: { bsonType: "string" },
        type: { 
          bsonType: "string",
          enum: ["Server", "Application", "Device", "Database"]
        },
        description: { bsonType: "string" },
        classification: {
          bsonType: "string",
          enum: ["public", "internal", "top secret"]
        },
        location: { bsonType: "string" },
        owner: { bsonType: "string" },
        value: {
          bsonType: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "in planning", "decommissioned"]
        },
        risks: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["risk_id", "description", "impact", "probability"],
            properties: {
              risk_id: { bsonType: "string" },
              description: { bsonType: "string" },
              impact: { bsonType: "string", enum: ["low", "medium", "high"] },
              probability: { bsonType: "string", enum: ["low", "medium", "high"] }
            }
          }
        },
        controls: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["control_id", "description"],
            properties: {
              control_id: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        last_audit: {
          bsonType: "object",
          properties: {
            date: { bsonType: "date" },
            auditor: { bsonType: "string" },
            result: { bsonType: "string", enum: ["compliant", "non-compliant", "pending"] }
          }
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Important: Index on asset_id for fast Joins
db.assets.createIndex({ "asset_id": 1 }, { unique: true });