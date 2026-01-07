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

// CORS Middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

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
            status: status || 'active',
            risks: [],
            controls: [],
            created_at: new Date(),
            updated_at: new Date()
        };

        if (description) assetDetails.description = description;
        if (classification) assetDetails.classification = classification;
        if (location) assetDetails.location = location;
        if (owner) assetDetails.owner = owner;
        if (value) assetDetails.value = value;

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

// Get a single asset (Mongo details) by numeric asset_id
app.get('/api/assets/:id', async (req, res) => {
    const assetId = parseInt(req.params.id, 10);

    if (Number.isNaN(assetId)) {
        return res.status(400).json({ success: false, message: 'Invalid asset id' });
    }

    try {
        const asset = await mongoDB.collection('assets').findOne({ asset_id: assetId });

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        res.json({ success: true, asset });
    } catch (err) {
        console.error('Error fetching asset:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Update MongoDB asset details by asset_id
app.put('/api/assets/:id', async (req, res) => {
    const assetId = parseInt(req.params.id, 10);

    if (Number.isNaN(assetId)) {
        return res.status(400).json({ success: false, message: 'Invalid asset id' });
    }

    const {
        name,
        type,
        description,
        classification,
        location,
        owner,
        value,
        status
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (type !== undefined) updateFields.type = type;
    if (description !== undefined) updateFields.description = description;
    if (classification !== undefined) updateFields.classification = classification;
    if (location !== undefined) updateFields.location = location;
    if (owner !== undefined) updateFields.owner = owner;
    if (value !== undefined) updateFields.value = value;
    if (status !== undefined) updateFields.status = status;

    updateFields.updated_at = new Date();

    try {
        const result = await mongoDB.collection('assets').updateOne(
            { asset_id: assetId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        res.json({ success: true, message: 'Asset updated successfully' });
    } catch (err) {
        console.error('Error updating asset:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Delete an asset from both MySQL and MongoDB
app.delete('/api/assets/:id', async (req, res) => {
    const assetId = parseInt(req.params.id, 10);

    if (Number.isNaN(assetId)) {
        return res.status(400).json({ success: false, message: 'Invalid asset id' });
    }

    let sqlConnection;
    try {
        sqlConnection = await mysqlPool.getConnection();
        await sqlConnection.beginTransaction();

        // Delete from MySQL first (ASSET_MGMT)
        const [sqlResult] = await sqlConnection.query(
            'DELETE FROM ASSET_MGMT WHERE ASSET_ID = ?',
            [assetId]
        );

        if (sqlResult.affectedRows === 0) {
            await sqlConnection.rollback();
            sqlConnection.release();
            return res.status(404).json({ success: false, message: 'Asset not found in MySQL' });
        }

        // Delete from MongoDB
        const mongoResult = await mongoDB.collection('assets').deleteOne({ asset_id: assetId });

        if (mongoResult.deletedCount === 0) {
            // Rollback SQL delete if Mongo delete fails / no document found
            await sqlConnection.rollback();
            sqlConnection.release();
            return res.status(404).json({ success: false, message: 'Asset not found in MongoDB' });
        }

        await sqlConnection.commit();
        sqlConnection.release();

        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (err) {
        console.error('Error deleting asset:', err);
        if (sqlConnection) {
            try {
                await sqlConnection.rollback();
                sqlConnection.release();
            } catch (rollbackErr) {
                console.error('Error during rollback:', rollbackErr);
            }
        }
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});