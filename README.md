# SentinelIS

## Folder Structure
```yaml
SentinelIS
├─ backend/
│   ├─ LiveChatApp/
│   │   ├─ bin/
│   │   ├─ Hubs/
│   │   │   └─ ChatHub.cs
│   │   ├─ obj/
│   │   ├─ Pages/
│   │   │   ├─ Shared
│   │   │   │   ├─ _Layout.cshtml
│   │   │   │   └─ _Layout.cshtml.css
│   │   │   ├─ _ViewImports.cshtml
│   │   │   ├─ _ViewStart.cshtml
│   │   │   ├─ Error.cshtml
│   │   │   ├─ Error.cshtml.cs
│   │   │   ├─ Index.cshtml
│   │   │   ├─ Index.cshtml.cs
│   │   │   ├─ Privacy.cshtml
│   │   │   └─ Privacy.cshtml.cs
│   │   ├─ Properties/
│   │   │   └─ launchSettings.json
│   │   ├─ wwwroot/
│   │   │   ├─ css
│   │   │   │   └─ site.css
│   │   │   ├─ js
│   │   │   │   └─ site.js
│   │   │   └─ favicon.ico
│   │   ├─ appsettings.Developements.json
│   │   ├─ appsettings.json
│   │   ├─ LiveChatApp.csproj
│   │   └─ Programm.cs
│   ├─ main/
│   │   ├─ node/
│   │   │   ├─ graphql/
│   │   │   │   └─ scheme.graphql
│   │   │   ├─ Mimo/
│   │   │   │   └─ qua.json
│   │   │   ├─ .env
│   │   │   ├─ logger.js
│   │   │   ├─ server3000.js
│   │   │   └─ server4000.js
│   │   └─ routes.toml
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
│   │   ├─ mimo.js
│   │   ├─ renderer.js
│   │   └─ setup-handler.js
│   ├─ styles/
│   │   ├─ adduser.css
│   │   ├─ dashboard.css
│   │   ├─ login.css
│   │   ├─ mimo.css
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
├─ start.sh
└─ Test.sln
```

## Start

### Docker

```cmd
# to start the entire application
docker-compose up

# to end the entire application
# without deleting the data
docker-compose down
```

### Node Server
```cmd
node server3000.js
```

### Electron GUI
```cmd
npm start
```

### .NET Livechat
```cmd
dotnet clean

dotnet run
```

### Python Server

If you use Python 3.13 you have to activate Python 3.12 first. Pillow does not work well or not at all on Python 3.13.



```python
# New venv
python3.12 -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r backend/main/python/requirements.txt

# Run the server
python backend/main/python/pfp.py
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
- Redis

### Build & Tools
- Docker (Containerization)
- npm (Package Manager)

### Testing
- Python (Test Connection for Databases)

## In Planing; not used yet
- Prisma
- Zod
- Pino for Logging
- SQLite for saving binary blobs (for images)
- ASP .NET for Chat system
- SignalR for Chat
- Python
- Flask

## Note

> Some of the code and/or documentation in this project may have been generated, improved, or refactored with the assistance of AI tools such as GitHub Copilot, ChatGPT, or Claude, based on prompts written by the author. All code and associated documentation is licensed under the GPL-3.0 License (see LICENSE). 

## Documentation
This is the link to the official Documentation: [Documentation](https://sentinelis.github.io/Documentation/)
