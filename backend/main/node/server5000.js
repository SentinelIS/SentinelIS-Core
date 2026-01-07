/*
++-------------------------------++
|| ======== SERVER 5000 ======== ||
++-------------------------------++

API Endpoints:
- POST /api/assets - Create a new asset
- GET /api/assets/:id - Get asset details by asset_id
- PUT /api/assets/:id - Update asset details by asset_id
- DELETE /api/assets/:id - Delete an asset by asset_id

*/

const express = require('express');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const path = require('path');
require('dotenv').config(); 

console.log("Starting server on port 5000...");

const app = express();
const PORT = 5000;

let mysqlPool;
let mongoDB;
let redisClient;
let redisEnabled = false;

// Cache configuration
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_KEY_PREFIX = 'asset:';

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

        // Redis Connection
        console.log("[INIT] Creating Redis client...");
        const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        redisClient = createClient({
            url: redisUrl,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.log('[REDIS] Max reconnection attempts reached. Cache disabled.');
                        redisEnabled = false;
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('[REDIS] Redis Client Error:', err);
            redisEnabled = false;
        });

        redisClient.on('connect', () => {
            console.log('[REDIS] Redis client connecting...');
        });

        redisClient.on('ready', () => {
            console.log('[REDIS] ✓ Redis client ready');
            redisEnabled = true;
        });

        redisClient.on('reconnecting', () => {
            console.log('[REDIS] Redis client reconnecting...');
        });

        await redisClient.connect();
        console.log(`[INIT] ✓ Redis connected successfully`);

    } catch (err) {
        console.error("Error during database initialization:", err);
        if (err.message && err.message.includes('Redis')) {
            console.warn('[REDIS] Redis connection failed. Continuing without cache.');
            redisEnabled = false;
        } else {
            process.exit(1);
        }
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

// Redis Cache Helper Functions
async function getCachedAsset(assetId) {
    if (!redisEnabled || !redisClient) return null;
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${assetId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`[CACHE] Cache HIT for asset ${assetId}`);
            return JSON.parse(cached);
        }
        console.log(`[CACHE] Cache MISS for asset ${assetId}`);
        return null;
    } catch (err) {
        console.error('[CACHE] Error reading from cache:', err);
        return null;
    }
}

async function setCachedAsset(assetId, assetData) {
    if (!redisEnabled || !redisClient) return;
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${assetId}`;
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(assetData));
        console.log(`[CACHE] Cached asset ${assetId} for ${CACHE_TTL}s`);
    } catch (err) {
        console.error('[CACHE] Error writing to cache:', err);
    }
}

async function invalidateAssetCache(assetId) {
    if (!redisEnabled || !redisClient) return;
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${assetId}`;
        await redisClient.del(cacheKey);
        console.log(`[CACHE] Invalidated cache for asset ${assetId}`);
    } catch (err) {
        console.error('[CACHE] Error invalidating cache:', err);
    }
}

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

        // 5. Cache the newly created asset
        await setCachedAsset(assetId, assetDetails);

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
        // Try to get from cache first
        let asset = await getCachedAsset(assetId);

        // If not in cache, fetch from MongoDB
        if (!asset) {
            asset = await mongoDB.collection('assets').findOne({ asset_id: assetId });

            if (!asset) {
                return res.status(404).json({ success: false, message: 'Asset not found' });
            }

            // Cache the asset for future requests
            await setCachedAsset(assetId, asset);
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

        // Invalidate cache to force refresh on next GET
        await invalidateAssetCache(assetId);

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

        // Invalidate cache after deletion
        await invalidateAssetCache(assetId);

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