# SentinelIS

Sentinel = Guard
IS = Information Security

## Folder Structure
```yaml
SentinelIS
│
├─ backend/
│   ├─ main/
│   │   ├─ java/
│   │   │   ├─ .env              
│   │   │   ├─ ConnectDB.java 
│   │   │   └─ TestConnectDB.java
│   │   ├─ node/
│   │   │   ├─ .env              
│   │   │   ├─ server3000.js              
│   │   │   └─ server4000.js
│   │   └─ python/
│   │       ├─ .env              
│   │       ├─ TestConnectGather.py              
│   │       ├─ TestConnectMongoDB.py              
│   │       └─ TestListCollections.py
│   └─ pom.xml   
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
│   │   ├─ icon.svg
│   │   └─ logo.svg
│   ├─ scripts/
│   │   ├─ login-handler.js
│   │   └─ setup-handler.js
│   ├─ styles/
│   │   └─ login.css
│   ├─ admin-cr-user.html
│   ├─ dashboard.html
│   ├─ login.html
│   └─ setup.html
│
├─ node_modules/
├─ .gitignore
├─ LICENSE.txt
├─ main.js
├─ package-lock.json
├─ package.json
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
- Java (Test Connection to MySQL)
- Python (Test Connection to MongoDB)


## Note

> Some of the code and/or documentation in this project may have been generated, improved, or refactored with the assistance of AI tools such as GitHub Copilot, ChatGPT, or Claude, based on prompts written by the author. All code and associated documentation is licensed under the Non-Commercial Use License (see LICENSE). 

## Documentation
This is the link to the official Documentation: [Documentation](https://sentinelis.github.io/Documentation/)