# SentinelIS

Sentinel = Guard
IS = Information Security

## Folder Structure
```yaml
SentinelIS
├─ backend/
│   ├─ main/
│   │   └─ node/
│   │       ├─ graphql/
│   │       │   └─ scheme.graphql
│   │       ├─ .env
│   │       ├─ logger.js
│   │       ├─ server3000.js
│   │       └─ server4000.js
│   ├─ testing/
│   │   ├─ .env
│   │   ├─ TestConnectGather.py
│   │   ├─ TestConnectMongoDB.py
│   │   └─ TestListCollections.py
│   └─ openapi.yaml
│
├─ database/
│   ├─ asset-mgmt/
│   │   ├─ assets_detail.js
│   │   └─ assets.sql
│   ├─ chat/
│   │   ├─ querys/
│   │   │   └─ query.sql
│   │   ├─ conversation.sql
│   │   ├─ conversation-participants.sql
│   │   └─ messages.sql
│   ├─ testing/
│   │   ├─ inserts-assets.js
│   │   ├─ inserts.sql
│   │   ├─ querys.sql
│   │   └─ updates.sql
│   ├─ company.sql
│   ├─ user-preferences.sql
│   └─ users.sql
│
├─ docker/
│   ├─ .env
│   └─ docker-compose.yaml
│
├─ frontend/
│   ├─ icons/
│   │   ├─ cli/
│   │   │   ├─ asciitest.sh
│   │   │   ├─ eye.txt
│   │   │   └─ sentinelis.txt
│   │   ├─ icon-white.svg
│   │   ├─ icon.svg
│   │   └─ logo.svg
│   ├─ scripts/
│   │   ├─ adduser.js
│   │   ├─ login-handler.js
│   │   ├─ renderer.js
│   │   └─ setup-handler.js
│   ├─ styles/
│   │   ├─ login.css
│   │   └─ setup.css
│   ├─ adduser.html
│   ├─ dashboard.html
│   ├─ index.html
│   ├─ login.html
│   └─ setup.html
│
├─ node_modules/
├─ sqlite/
│   ├─ data/
│   │   └─ mydb.sqlite
│   └─ avatars.sql
├─ .gitignore
├─ LICENSE.txt
├─ main.js
├─ package-lock.json
├─ package.json
├─ preload.js
├─ README.md
└─ start.sh
```

## Techstack
### Frontend
- Electron (GUI)
- HTML (UI)
- CSS (Styling)
- JavaScript ( Frontend Logic / Backend Requests)

### Backend
- Node.js (Runtime)
- Express.js (HTTP Server Framework)
- Apollo Server (GraphQL Server)

### Database
- MySQL (Relational Database)
- MongoDB (NoSQL Database)

### Build & Tools
- Docker (Containerization)
- npm (Package Manager)

### Testing
- Python (Test Connection for Databases)

## In Planing; not used yet
- Redis
- Prisma
- Zod
- Pino for Logging
- SQLite for saving binary blobs (for images)
- ASP .NET for Chat system
- SignalR for Chat

## Note

> Some of the code and/or documentation in this project may have been generated, improved, or refactored with the assistance of AI tools such as GitHub Copilot, ChatGPT, or Claude, based on prompts written by the author. All code and associated documentation is licensed under the GPL-3.0 License (see LICENSE). 

## Documentation
This is the link to the official Documentation: [Documentation](https://sentinelis.github.io/Documentation/)