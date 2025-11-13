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