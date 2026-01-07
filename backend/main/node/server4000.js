/*
++-------------------------------++
|| ======== SERVER 4000 ======== ||
++-------------------------------++

*/

// server4000.js – Combines GraphQL Microservice (MySQL + MongoDB)
require("dotenv").config({ path: __dirname + "/.env" });
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { gql } = require("graphql-tag");

// ----------------------------
// MySQL Connection
// ----------------------------
const mysql = require("mysql2/promise");

// MySQL Connection Pool
console.log("[INIT] Creating MySQL connection pool...");
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",  // Fallback to "mysql" for Docker
  port: process.env.MYSQL_PORT || 3307,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD, 
  database: process.env.MYSQL_DATABASE  
});
console.log(`[INIT] MySQL pool configured for ${process.env.MYSQL_HOST || "mysql"}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE}`);

// ----------------------------
// MongoDB Connection
// ----------------------------
const { MongoClient } = require("mongodb");

console.log("[INIT] Creating MongoDB client...");
const mongoClient = new MongoClient(process.env.MONGO_CONNECTION_STRING);

let mongoDB;

// ----------------------------
// GraphQL Scheme
// ----------------------------
const typeDefs = gql`

  type AssetMgmt {
    asset_id: ID!
    user_cr_id: Int!
    comp_id: Int!
    last_upd: String
  }

  type Risk {
    risk_id: String
    description: String
    impact: String
    probability: String
  }

  type Control {
    control_id: String
    description: String
  }

  type LastAudit {
    date: String
    auditor: String
    result: String
  }

  type AssetDetails {
    asset_id: Int!
    name: String
    type: String
    description: String
    classification: String
    location: String
    owner: String
    value: String
    status: String
    risks: [Risk]
    controls: [Control]
    last_audit: LastAudit
  }

  # --- Combinded GraphQL-Typ ---
  type Asset {
    asset_id: ID!
    mysql: AssetMgmt!
    mongo: AssetDetails
  }

  type Query {
    asset(asset_id: ID!): Asset
    assets(comp_id: Int!): [Asset!]!
  }
`;


// ----------------------------
// Resolver
// ----------------------------
const resolvers = {
  Query: {
    asset: async (_, { asset_id }) => {
      console.log(`[QUERY] Fetching single asset with ID: ${asset_id}`);
      
      console.log(`[MYSQL] Querying asset ${asset_id} from MySQL...`);
      const mysqlData = await getMySQLAsset(asset_id);
      
      if (!mysqlData) {
        console.log(`[MYSQL] Asset ${asset_id} not found in MySQL`);
        return null;
      }
      console.log(`[MYSQL] Asset ${asset_id} found:`, mysqlData);

      console.log(`[MONGO] Querying asset ${asset_id} from MongoDB...`);
      const mongoData = await getMongoAsset(asset_id);
      
      if (mongoData) {
        console.log(`[MONGO] Asset ${asset_id} found in MongoDB`);
      } else {
        console.log(`[MONGO] Asset ${asset_id} not found in MongoDB`);
      }

      console.log(`[QUERY] Successfully resolved asset ${asset_id}`);
      return {
        asset_id,
        mysql: mysqlData,
        mongo: mongoData
      };
    },

    assets: async (_, { comp_id }) => {
      console.log(`[QUERY] Fetching all assets for comp_id: ${comp_id}`);
      
      console.log(`[MYSQL] Executing SELECT * FROM ASSET_MGMT WHERE COMP_ID = ?`);
      const [rows] = await mysqlPool.query("SELECT * FROM ASSET_MGMT WHERE COMP_ID = ?", [comp_id]);
      console.log(`[MYSQL] Found ${rows.length} assets in MySQL for comp_id: ${comp_id}`);

      console.log(`[PROCESSING] Enriching assets with MongoDB data...`);
      const assets = await Promise.all(rows.map(async (row, index) => {
        console.log(`[PROCESSING] Asset ${index + 1}/${rows.length}: ID ${row.ASSET_ID}`);
        
        const mongoData = await getMongoAsset(row.ASSET_ID);
        if (mongoData) {
          console.log(`[MONGO] ✓ Found MongoDB data for asset ${row.ASSET_ID}`);
        } else {
          console.log(`[MONGO] ✗ No MongoDB data for asset ${row.ASSET_ID}`);
        }
        
        return {
          asset_id: row.ASSET_ID,
          mysql: formatMYSQL(row),
          mongo: mongoData
        };
      }));

      console.log(`[QUERY] Successfully resolved ${assets.length} assets`);
      return assets;
    }
  }
};


// ----------------------------
// DB Helper – MySQL
// ----------------------------
function formatMYSQL(row) {
  return {
    asset_id: row.ASSET_ID,
    user_cr_id: row.USER_CR_ID,
    comp_id: row.COMP_ID,
    last_upd: row.LAST_UPD
  };
}

async function getMySQLAsset(asset_id) {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM ASSET_MGMT WHERE ASSET_ID = ?", 
      [asset_id]
    );

    if (rows.length === 0) {
      console.log(`[MYSQL] No rows returned for asset_id: ${asset_id}`);
      return null;
    }
    
    console.log(`[MYSQL] Retrieved ${rows.length} row(s) for asset_id: ${asset_id}`);
    return formatMYSQL(rows[0]);
  } catch (error) {
    console.error(`[MYSQL ERROR] Failed to query asset ${asset_id}:`, error.message);
    throw error;
  }
}


// ----------------------------
// DB Helper – MongoDB
// ----------------------------
async function getMongoAsset(asset_id) {
  try {
    const result = await mongoDB.collection("assets").findOne({ asset_id: parseInt(asset_id) });
    
    if (result) {
      console.log(`[MONGO] Document found for asset_id: ${asset_id}`);
    } else {
      console.log(`[MONGO] No document found for asset_id: ${asset_id}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[MONGO ERROR] Failed to query asset ${asset_id}:`, error.message);
    throw error;
  }
}


// ----------------------------
// Server staertup
// ----------------------------
(async () => {
  try {
    console.log("\n========================================");
    console.log("  STARTING GRAPHQL MICROSERVICE");
    console.log("========================================\n");

    // Mongo connection
    console.log("[STARTUP] Connecting to MongoDB...");
    console.log(`[STARTUP] Connection string: ${process.env.MONGO_CONNECTION_STRING.replace(/\/\/.*:.*@/, '//***:***@')}`);
    
    await mongoClient.connect();
    mongoDB = mongoClient.db(process.env.MONGO_INITDB_DATABASE);

    console.log(`[STARTUP] ✓ MongoDB connected successfully`);
    console.log(`[STARTUP] ✓ Using database: ${process.env.MONGO_INITDB_DATABASE}`);

    // Test MySQL connection
    console.log("\n[STARTUP] Testing MySQL connection...");
    try {
      await mysqlPool.query("SELECT 1");
      console.log("[STARTUP] ✓ MySQL connection successful");
    } catch (err) {
      console.error("[STARTUP] ✗ MySQL connection failed:", err.message);
      throw err;
    }

    // GraphQL Server
    console.log("\n[STARTUP] Initializing GraphQL server...");
    const server = new ApolloServer({
      typeDefs,
      resolvers
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 }
    });

    console.log("\n========================================");
    console.log(`  ✓ GraphQL Microservice running at:`);
    console.log(`  ${url}`);
    console.log("========================================\n");
    console.log("[INFO] Ready to accept queries");
    console.log("[INFO] Available queries:");
    console.log("  - asset(asset_id: ID!)");
    console.log("  - assets");
    console.log("\n");

  } catch (err) {
    console.error("\n========================================");
    console.error("  ✗ STARTUP ERROR");
    console.error("========================================");
    console.error(err);
    process.exit(1);
  }
})();