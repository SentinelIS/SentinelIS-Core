/*
++-------------------------------++
|| ======== SERVER 3000 ======== ||
++-------------------------------++
*/

const express = require('express');
const mysql = require('mysql2/promise');

console.log("Starting server on port 3000...");

const app = express();
const PORT = 3000;

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'your_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json());

// Test database connection
app.get('/api/test', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT 1');
        connection.release();
        res.json({ status: 'Database connected', data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
