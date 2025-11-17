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
│   │   │   └─ server3000.js
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
│   │   └─ inserts.sql              
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
│   │   └─ login-handler.js
│   ├─ styles/
│   │   └─ login.css
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
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Docker

### Database
- MySQL
- MongoDB

### Testing
- Java
- Python


## Note

> Some of the code and/or documentation in this project may have been generated, improved, or refactored with the assistance of AI tools such as GitHub Copilot, ChatGPT, or Claude, based on prompts written by the author. All code and associated documentation is licensed under the Non-Commercial Use License (see LICENSE). 

## Documentation
This is the link to the official Documentation: [Documentation](https://sentinelis.github.io/Documentation/)