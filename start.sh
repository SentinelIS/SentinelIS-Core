#!/bin/bash

cd sqlite || exit 1

# Initialize SQLite database if not exists
if [ ! -f data/mydb.sqlite ]; then
    mkdir -p data
    sqlite3 data/mydb.sqlite < avatars.sql
    echo "SQLite database initialized."
else
    echo "SQLite database already exists."
fi
cd .. || exit 1

# Docker
cd "$(dirname "$0")"/docker || exit 1
docker-compose up -d

cd .. || exit 1
cd backend || exit 1

cd main || exit 1
cd node || exit 1

# Run Node.js servers
node server3000.js
node server4000.js

cd ../../.. || exit 1

echo "All services started."