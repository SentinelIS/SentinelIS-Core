/*
++-------------------------------++
|| ======== SERVER 3000 ======== ||
++-------------------------------++
*/

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config(); 

console.log("Starting server on port 3000...");

const app = express();
const PORT = 3000;

let pool;
(async () => {
    try {
        pool = mysql.createPool({
            host: 'localhost',
            port: process.env.MYSQL_PORT || 3307, 
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("Database pool created successfully.");
        const connection = await pool.getConnection();
        console.log("Successfully connected to the database!");
        const [rows] = await connection.query('SELECT 1');
        console.log("Test query result:", rows);
        connection.release();
    } catch (err) {
        console.error("Error while connecting to the database:", err);
    }
})();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', '..', 'frontend')));

app.get('/api/test', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        console.log("Connection acquired for /api/test endpoint");
        const [rows] = await connection.query('SELECT 1');
        console.log("Query result for /api/test:", rows);
        connection.release();
        res.json({ status: 'Database connected', data: rows });
    } catch (error) {
        console.error("Error in /api/test endpoint:", error);
        res.status(500).json({ error: error.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    console.log("POST /api/login received with body:", req.body);
    
    const { company, username, password } = req.body || {};
    if (!company || !username || !password) {
        console.log("Missing credentials");
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    try {
        const conn = await pool.getConnection();
        console.log(`Querying user: COMP_ID=${company}, USER_ABBR=${username}`);
        
        const [rows] = await conn.query(
            'SELECT USER_ID, USER_ABBR, USER_PASSWORD, USER_SURNAME, USER_FIRST_NAME, USER_ROLE FROM USERS WHERE COMP_ID = ? AND USER_ABBR = ? LIMIT 1',
            [company, username]
        );
        conn.release();

        if (!rows || rows.length === 0) {
            console.log("User not found");
            return res.status(401).json({ success: false, message: 'Invalid company or username' });
        }

        const user = rows[0];
        const stored = user.USER_PASSWORD || '';
        console.log(`User found: ${user.USER_FIRST_NAME} ${user.USER_SURNAME}`);

        let passwordMatches = false;
        if (typeof stored === 'string' && stored.startsWith('$2')) {
            passwordMatches = await bcrypt.compare(password, stored);
        } else {
            passwordMatches = stored === password;
        }

        if (!passwordMatches) {
            console.log("Password does not match");
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        console.log("Login successful");
        return res.json({ success: true, redirect: '/dashboard.html' });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});