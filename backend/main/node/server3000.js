/*
++-------------------------------++
|| ======== SERVER 3000 ======== ||
++-------------------------------++

open the browser on http://localhost:3000/login.html
if the login is successful, you will be redirected to http://localhost:3000/dashboard.html .

if you want to setup for a new company, you will be redirected to http://localhost:3000/setup.html
after the setup, you will receive your company ID and be able to login with the created user.

if you need help during the setup, you can click on the "Ask Mimo" button in the upper right corner of the page.

If the login was successfull you will find yourself at: http://localhost:3000/dashboard.html
From there you can add more users to your company via the "Add User" button. 
From wich you will be redirected to http://localhost:3000/adduser.html

API Endpoints:
- GET  /api/test        - test database connection
- POST /api/login       - user login
- POST /api/setup       - initial setup for a new company
- POST /api/users       - create a new user for an existing company
- POST /api/chatbot     - chatbot endpoint

*/

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');

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
        
        const token = jwt.sign(
            {
            userId: user.USER_ID,
            company,
            username: user.USER_ABBR,
            surname: user.USER_SURNAME,
            firstName: user.USER_FIRST_NAME,
            role: user.USER_ROLE
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(token)
        
        try {
            const response = await fetch('http://localhost:5137/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (response.ok) {
                console.log('JWT token successfully sent to localhost:5137');
                console.log('Response status:', response.status);
            } else {
                console.warn('JWT token sent but received non-OK response:', response.status, response.statusText);
            }
        } catch (fetchErr) {
            console.error('Error sending token to localhost:5137:', fetchErr);
        }
        return res.json({ 
            success: true, 
            redirect: '/dashboard.html',
            userId: user.USER_ID,
            companyId: company,
            username: user.USER_ABBR
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.post('/api/setup', async (req, res) => {
    console.log("POST /api/setup received with body:", req.body);
    const { companyName, companyDesc, userAbbr, firstname, surname, role, password, passwordRepeat } = req.body || {};

    if (!companyName || !companyDesc || !userAbbr || !firstname || !surname || !role || !password || !passwordRepeat) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (password !== passwordRepeat) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    try {
        const conn = await pool.getConnection();

        // 1. Insert Company
        const [companyResult] = await conn.query(
            'INSERT INTO COMPANY (COMP_NAME, COMP_DESC) VALUES (?, ?)',
            [companyName, companyDesc]
        );
        const companyId = companyResult.insertId;
        console.log("Company created with ID:", companyId);

        // 2. Insert User (passwort im Klartext)
        const [userResult] = await conn.query(
            'INSERT INTO USERS (COMP_ID, USER_ABBR, USER_SURNAME, USER_FIRST_NAME, USER_ROLE, USER_PASSWORD) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, userAbbr, surname, firstname, role, password]
        );
        const userId = userResult.insertId;
        console.log("User created with ID:", userId);

        // 3. Update Company Owner
        await conn.query(
            'UPDATE COMPANY SET COMP_OWNER_ID = ? WHERE COMP_ID = ?',
            [userId, companyId]
        );
        console.log("Company owner updated");

        conn.release();
        return res.json({ success: true, message: 'Setup completed successfully', companyId, userId });
    } catch (err) {
        console.error('Setup error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Create additional user for an existing company
app.post('/api/users', async (req, res) => {
    console.log("POST /api/users received with body:", req.body);
    const { companyId, role, firstname, surname, username, password } = req.body || {};

    if (!companyId || !role || !firstname || !surname || !username || !password) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    try {
        const conn = await pool.getConnection();

        const [result] = await conn.query(
            'INSERT INTO USERS (COMP_ID, USER_ABBR, USER_SURNAME, USER_FIRST_NAME, USER_ROLE, USER_PASSWORD) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, username, surname, firstname, role, password]
        );

        const userId = result.insertId;
        console.log("Additional user created with ID:", userId, "for company:", companyId);

        conn.release();
        return res.json({ success: true, message: 'User created successfully', userId });
    } catch (err) {
        console.error('Create user error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Helper function to calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                );
            }
        }
    }

    return dp[m][n];
}

// Helper function to calculate similarity score (0-1)
function calculateSimilarity(input, question) {
    const inputLower = input.toLowerCase().trim();
    const questionLower = question.toLowerCase().trim();

    // Exact match
    if (inputLower === questionLower) {
        return 1.0;
    }

    // Word-based similarity
    const inputWords = inputLower.split(/\s+/);
    const questionWords = questionLower.split(/\s+/);
    const commonWords = inputWords.filter(word => questionWords.includes(word));
    const wordSimilarity = (commonWords.length * 2) / (inputWords.length + questionWords.length);

    // Levenshtein distance similarity
    const maxLength = Math.max(inputLower.length, questionLower.length);
    const levenshteinSim = maxLength > 0 ? 1 - (levenshteinDistance(inputLower, questionLower) / maxLength) : 0;

    // Combined score (weighted average)
    return (wordSimilarity * 0.6) + (levenshteinSim * 0.4);
}

// Chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
    console.log("POST /api/chatbot received with body:", req.body);
    const { question } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Question is required' });
    }

    try {
        // Read the FAQ JSON file
        const faqPath = path.join(__dirname, 'Mimo', 'qua.json');
        const faqData = await fs.readFile(faqPath, 'utf8');
        const faqs = JSON.parse(faqData);

        if (!faqs.faqs || !Array.isArray(faqs.faqs)) {
            return res.status(500).json({ success: false, message: 'Invalid FAQ data structure' });
        }

        let bestMatch = null;
        let bestScore = 0;
        const similarityThreshold = 0.3; // Minimum similarity threshold

        // Find the most similar question
        for (const faq of faqs.faqs) {
            if (!faq.questions || !Array.isArray(faq.questions)) continue;

            for (const faqQuestion of faq.questions) {
                const similarity = calculateSimilarity(question.trim(), faqQuestion);
                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestMatch = faq;
                }
            }
        }

        // If similarity is below threshold, return cannot answer message
        if (bestScore < similarityThreshold || !bestMatch) {
            return res.json({
                success: true,
                answer: "I'm sorry, I cannot answer that question. Please try rephrasing your question or ask about SentinelIS setup, features, or information security.",
                similarity: bestScore
            });
        }

        // Return the answer
        return res.json({
            success: true,
            answer: bestMatch.answer,
            similarity: bestScore
        });

    } catch (err) {
        console.error('Chatbot error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});