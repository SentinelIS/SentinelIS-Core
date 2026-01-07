/*
++-------------------------------++
|| ======== SERVER 5000 ======== ||
++-------------------------------++

API Endpoints:
- POST /api/assets - Create a new asset
- GET /api/assets/:id - Get asset details by asset_id
- PUT /api/assets/:id - Update asset details by asset_id
- DELETE /api/assets/:id - Delete an asset by asset_id
- GET /api/assets/analytics/by-type?companyId=X - Assets grouped by type
- GET /api/assets/analytics/by-status?companyId=X - Assets grouped by status
- GET /api/assets/analytics/by-value?companyId=X - Assets grouped by value
- GET /api/assets/analytics/by-classification?companyId=X - Assets grouped by classification
- GET /api/assets/analytics/by-month?companyId=X - Assets created over time (monthly)
- GET /api/assets/analytics/summary?companyId=X - Overall summary statistics

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
const CACHE_TTL_AGGREGATIONS = 300; // 5 minutes for aggregations (shorter TTL since they change more frequently)
const CACHE_KEY_PREFIX = 'asset:';
const CACHE_KEY_PREFIX_AGG = 'agg:';

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

// Aggregation cache helper functions
async function getCachedAggregation(aggType, companyId) {
    if (!redisEnabled || !redisClient) return null;
    try {
        const cacheKey = `${CACHE_KEY_PREFIX_AGG}${aggType}:${companyId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`[CACHE] Cache HIT for aggregation ${aggType} (company ${companyId})`);
            return JSON.parse(cached);
        }
        console.log(`[CACHE] Cache MISS for aggregation ${aggType} (company ${companyId})`);
        return null;
    } catch (err) {
        console.error('[CACHE] Error reading aggregation from cache:', err);
        return null;
    }
}

async function setCachedAggregation(aggType, companyId, data) {
    if (!redisEnabled || !redisClient) return;
    try {
        const cacheKey = `${CACHE_KEY_PREFIX_AGG}${aggType}:${companyId}`;
        await redisClient.setEx(cacheKey, CACHE_TTL_AGGREGATIONS, JSON.stringify(data));
        console.log(`[CACHE] Cached aggregation ${aggType} (company ${companyId}) for ${CACHE_TTL_AGGREGATIONS}s`);
    } catch (err) {
        console.error('[CACHE] Error writing aggregation to cache:', err);
    }
}

async function invalidateAllAggregations(companyId) {
    if (!redisEnabled || !redisClient) return;
    try {
        // Invalidate all aggregation caches for this company
        const pattern = `${CACHE_KEY_PREFIX_AGG}*:${companyId}`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`[CACHE] Invalidated ${keys.length} aggregation cache(s) for company ${companyId}`);
        }
    } catch (err) {
        console.error('[CACHE] Error invalidating aggregation caches:', err);
    }
}

// Helper function to get asset IDs for a company
async function getCompanyAssetIds(companyId) {
    try {
        const sqlConnection = await mysqlPool.getConnection();
        const [rows] = await sqlConnection.query(
            'SELECT ASSET_ID FROM ASSET_MGMT WHERE COMP_ID = ?',
            [companyId]
        );
        sqlConnection.release();
        return rows.map(row => row.ASSET_ID);
    } catch (err) {
        console.error('Error fetching company asset IDs:', err);
        return [];
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
        
        // 6. Invalidate aggregation caches since we added a new asset
        await invalidateAllAggregations();

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
        
        // Get companyId from MySQL to invalidate correct aggregation cache
        let sqlConnection;
        try {
            sqlConnection = await mysqlPool.getConnection();
            const [rows] = await sqlConnection.query(
                'SELECT COMP_ID FROM ASSET_MGMT WHERE ASSET_ID = ?',
                [assetId]
            );
            sqlConnection.release();
            if (rows.length > 0) {
                await invalidateAllAggregations(rows[0].COMP_ID);
            }
        } catch (err) {
            console.error('Error getting companyId for cache invalidation:', err);
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
        
        // Get companyId BEFORE deletion to invalidate correct aggregation cache
        let companyIdForCache;
        try {
            const [rows] = await sqlConnection.query(
                'SELECT COMP_ID FROM ASSET_MGMT WHERE ASSET_ID = ?',
                [assetId]
            );
            if (rows.length > 0) {
                companyIdForCache = rows[0].COMP_ID;
            }
        } catch (err) {
            console.error('Error getting companyId for cache invalidation:', err);
        }
        
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
        
        // Invalidate aggregation caches since we deleted an asset
        if (companyIdForCache) {
            await invalidateAllAggregations(companyIdForCache);
        }

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

// MongoDB Aggregation Endpoints
// GET /api/assets/analytics/by-type?companyId=X - Assets grouped by type
app.get('/api/assets/analytics/by-type', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        // Get asset IDs for this company
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        // Try cache first
        let result = await getCachedAggregation('by-type', companyId);
        
        if (!result) {
            result = await mongoDB.collection('assets').aggregate([
                {
                    $match: {
                        asset_id: { $in: assetIds }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $project: {
                        _id: 0,
                        type: '$_id',
                        count: 1
                    }
                }
            ]).toArray();
            
            await setCachedAggregation('by-type', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching assets by type:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET /api/assets/analytics/by-status?companyId=X - Assets grouped by status
app.get('/api/assets/analytics/by-status', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        let result = await getCachedAggregation('by-status', companyId);
        
        if (!result) {
            result = await mongoDB.collection('assets').aggregate([
                {
                    $match: {
                        asset_id: { $in: assetIds }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $project: {
                        _id: 0,
                        status: '$_id',
                        count: 1
                    }
                }
            ]).toArray();
            
            await setCachedAggregation('by-status', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching assets by status:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET /api/assets/analytics/by-value?companyId=X - Assets grouped by value
app.get('/api/assets/analytics/by-value', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        let result = await getCachedAggregation('by-value', companyId);
        
        if (!result) {
            result = await mongoDB.collection('assets').aggregate([
                {
                    $match: {
                        asset_id: { $in: assetIds }
                    }
                },
                {
                    $group: {
                        _id: '$value',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { 
                        _id: 1 // Sort by value order: low, medium, high, critical
                    }
                },
                {
                    $project: {
                        _id: 0,
                        value: '$_id',
                        count: 1
                    }
                }
            ]).toArray();
            
            await setCachedAggregation('by-value', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching assets by value:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET /api/assets/analytics/by-classification?companyId=X - Assets grouped by classification
app.get('/api/assets/analytics/by-classification', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        let result = await getCachedAggregation('by-classification', companyId);
        
        if (!result) {
            result = await mongoDB.collection('assets').aggregate([
                {
                    $match: {
                        asset_id: { $in: assetIds }
                    }
                },
                {
                    $group: {
                        _id: '$classification',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $project: {
                        _id: 0,
                        classification: '$_id',
                        count: 1
                    }
                }
            ]).toArray();
            
            await setCachedAggregation('by-classification', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching assets by classification:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET /api/assets/analytics/by-month?companyId=X - Assets created over time (monthly)
app.get('/api/assets/analytics/by-month', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        let result = await getCachedAggregation('by-month', companyId);
        
        if (!result) {
            result = await mongoDB.collection('assets').aggregate([
                {
                    $match: {
                        asset_id: { $in: assetIds },
                        created_at: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$created_at' },
                            month: { $month: '$created_at' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        monthName: {
                            $arrayElemAt: [
                                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                { $subtract: ['$_id.month', 1] }
                            ]
                        },
                        label: {
                            $concat: [
                                { $arrayElemAt: [
                                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                    { $subtract: ['$_id.month', 1] }
                                ]},
                                ' ',
                                { $toString: '$_id.year' }
                            ]
                        },
                        count: 1
                    }
                }
            ]).toArray();
            
            await setCachedAggregation('by-month', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching assets by month:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// GET /api/assets/analytics/summary?companyId=X - Overall summary statistics
app.get('/api/assets/analytics/summary', async (req, res) => {
    const companyId = parseInt(req.query.companyId, 10);
    
    if (Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid companyId parameter' });
    }
    
    try {
        const assetIds = await getCompanyAssetIds(companyId);
        if (assetIds.length === 0) {
            return res.json({ 
                success: true, 
                data: {
                    totalAssets: 0,
                    highValueAssets: 0,
                    byType: [],
                    byStatus: [],
                    byValue: []
                }
            });
        }
        
        let result = await getCachedAggregation('summary', companyId);
        
        if (!result) {
            const pipeline = [
                {
                    $match: {
                        asset_id: { $in: assetIds }
                    }
                },
                {
                    $facet: {
                        totalAssets: [{ $count: 'count' }],
                        byType: [
                            { $group: { _id: '$type', count: { $sum: 1 } } },
                            { $project: { _id: 0, type: '$_id', count: 1 } }
                        ],
                        byStatus: [
                            { $group: { _id: '$status', count: { $sum: 1 } } },
                            { $project: { _id: 0, status: '$_id', count: 1 } }
                        ],
                        byValue: [
                            { $group: { _id: '$value', count: { $sum: 1 } } },
                            { $project: { _id: 0, value: '$_id', count: 1 } }
                        ],
                        highValueAssets: [
                            { $match: { value: { $in: ['high', 'critical'] } } },
                            { $count: 'count' }
                        ]
                    }
                }
            ];
            
            const aggregationResult = await mongoDB.collection('assets').aggregate(pipeline).toArray();
            const facetData = aggregationResult[0];
            
            result = {
                totalAssets: facetData.totalAssets[0]?.count || 0,
                highValueAssets: facetData.highValueAssets[0]?.count || 0,
                byType: facetData.byType,
                byStatus: facetData.byStatus,
                byValue: facetData.byValue
            };
            
            await setCachedAggregation('summary', companyId, result);
        }
        
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching summary analytics:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});