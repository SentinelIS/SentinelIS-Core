/*
++-------------------------------++
|| ======== SERVER 5000 ======== ||
++-------------------------------++

API Endpoints:
- POST /api/assets - Create a new asset

*/

const express = require('express');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config(); 

console.log("Starting server on port 5000...");

const app = express();
const PORT = 5000;

let mysqlPool;
let mongoDB;

(async () => {
    try {
        // MySQL Connection Pool
        console.log("[INIT] Creating MySQL connection pool...");
        mysqlPool = mysql.createPool({
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3307,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log(`[INIT] MySQL pool configured for ${process.env.MYSQL_HOST || "localhost"}:${process.env.MYSQL_PORT || 3307}/${process.env.MYSQL_DATABASE}`);
        const connection = await mysqlPool.getConnection();
        console.log("Successfully connected to the database!");
        connection.release();

        // MongoDB Connection
        console.log("[INIT] Creating MongoDB client...");
        const mongoClient = new MongoClient(process.env.MONGO_CONNECTION_STRING);
        console.log(`[INIT] Connecting to MongoDB...`);
        await mongoClient.connect();
        mongoDB = mongoClient.db(process.env.MONGO_INITDB_DATABASE);
        console.log(`[INIT] ✓ MongoDB connected successfully`);
        console.log(`[INIT] ✓ Using database: ${process.env.MONGO_INITDB_DATABASE}`);

    } catch (err) {
        console.error("Error during database initialization:", err);
        process.exit(1);
    }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', '..', 'frontend')));

app.post('/api/assets', async (req, res) => {
    console.log("POST /api/assets received with body:", req.body);
    const {
        name,
        type,
        description,
        classification,
        location,
        owner,
        value,
        status,
        username, // Changed from userId
        companyId
    } = req.body;

    if (!name || !type || !username || !companyId) {
        return res.status(400).json({ success: false, message: 'Missing required fields: name, type, username, companyId' });
    }

    let sqlConnection;
    try {
        sqlConnection = await mysqlPool.getConnection();
        
        // Get userId from username and companyId
        const [users] = await sqlConnection.query('SELECT USER_ID FROM USERS WHERE USER_ABBR = ? AND COMP_ID = ?', [username, companyId]);
        if (users.length === 0) {
            sqlConnection.release();
            return res.status(404).json({ success: false, message: 'User not found for the given company.' });
        }
        const userId = users[0].USER_ID;

        await sqlConnection.beginTransaction();

        // 1. Insert into MySQL
        const [sqlResult] = await sqlConnection.query(
            'INSERT INTO ASSET_MGMT (USER_CR_ID, COMP_ID) VALUES (?, ?)',
            [userId, companyId]
        );
        const assetId = sqlResult.insertId;
        console.log(`[SQL] Asset created with ID: ${assetId}`);

        // 2. Prepare data for MongoDB
        const assetDetails = {
            asset_id: assetId,
            name,
            type,
            description: description || null,
            classification: classification || null,
            location: location || null,
            owner: owner || null,
            value: value || null,
            status: status || 'active',
            risks: [],
            controls: [],
            last_audit: null,
            created_at: new Date(),
            updated_at: new Date()
        };

        // 3. Insert into MongoDB
        const mongoResult = await mongoDB.collection('assets').insertOne(assetDetails);
        console.log(`[Mongo] Asset details inserted with ID: ${mongoResult.insertedId}`);

        // 4. Commit transaction
        await sqlConnection.commit();
        sqlConnection.release();

        res.status(201).json({ success: true, message: 'Asset created successfully', assetId: assetId });

    } catch (err) {
        console.error('Asset creation error:', err);
        if (sqlConnection) {
            await sqlConnection.rollback();
            sqlConnection.release();
        }
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});