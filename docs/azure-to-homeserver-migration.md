# Migrating from Azure to Home Server (Internal Use)

## Overview

Moves the live Azure-hosted app (App Service + Azure SQL + Static Web Apps) to a home server for internal-only use. No zero-downtime requirement — stop using Azure, migrate, switch over.

**Current Azure stack:**
- Backend: Azure App Service (ASP.NET Core API)
- Database: Azure SQL
- Frontend: Azure Static Web Apps (React) / Angular (pending)
- Auth: JWT Bearer + ASP.NET Core Identity + refresh tokens in SQL

---

## Phase 1 — Export Data from Azure SQL

**Option A: Azure Portal (easiest)**
1. Go to Azure Portal → SQL Database → your database
2. Click **Export** → save `.bacpac` to a Storage Account
3. Download the `.bacpac` locally

**Option B: sqlpackage CLI**
```bash
sqlpackage /Action:Export \
  /SourceConnectionString:"<azure-connection-string>" \
  /TargetFile:"applicationtracker.bacpac"
```

> The `.bacpac` contains both schema and all data — single file, portable.

---

## Phase 2 — Set Up Home Server Database

**Run SQL Server via Docker:**
```bash
docker run -d \
  --name sqlserver \
  -e ACCEPT_EULA=Y \
  -e SA_PASSWORD=<your-strong-password> \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

**Import the `.bacpac`:**
```bash
sqlpackage /Action:Import \
  /TargetConnectionString:"Server=localhost;Database=ApplicationTracker;User Id=sa;Password=<your-password>;TrustServerCertificate=True" \
  /SourceFile:"applicationtracker.bacpac"
```

**Verify the import:**
```bash
# Connect and spot-check row counts
docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P <password> -Q "SELECT COUNT(*) FROM ApplicationTracker.dbo.ApplicationRecords"
```

---

## Phase 3 — Reconfigure the Backend

**Connection string** — update via `dotnet user-secrets` or environment variable:
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Server=localhost;Database=ApplicationTracker;User Id=sa;Password=<password>;TrustServerCertificate=True" \
  --project src/backend/ApplicationTracker.Api
```

**CORS** — update `appsettings.Production.json` (or the env var equivalent) to point to your home server's frontend URL:
```json
{
  "AllowedOrigins": [ "http://apptracker.home", "http://192.168.1.x:4200" ]
}
```

**JWT / other secrets** — copy existing values; the key, issuer, and audience don't need to change:
```bash
dotnet user-secrets set "Jwt:Key" "<same-key-as-azure>" --project src/backend/ApplicationTracker.Api
```

**Run the API:**
```bash
dotnet run --project src/backend/ApplicationTracker.Api
# or publish and run behind a reverse proxy (see Phase 5)
```

---

## Phase 4 — Reconfigure the Frontend

**React client** — update `VITE_API_URL` in `.env.production`:
```
VITE_API_URL=http://apptracker.home/api
# or leave empty if served from the same origin as the API
```

Rebuild:
```bash
cd src/clients/ApplicationTracker.React
npm run build
# serve the dist/ folder via Nginx / Caddy / serve
```

**Angular client** (when deployed):
- Update `proxy.conf.json` target for dev, or set the API base URL for prod build

---

## Phase 5 — Networking

**Static IP for the home server:**
- Assign a DHCP reservation in your router so the server always gets the same local IP (e.g. `192.168.1.100`)

**Local DNS (optional, nicer URLs):**
- Add an entry in your router's DNS (if supported), or in each client machine's `/etc/hosts` / `C:\Windows\System32\drivers\etc\hosts`:
  ```
  192.168.1.100   apptracker.home
  ```

**Reverse proxy (recommended for running both API and frontend on port 80):**

Caddy example (`Caddyfile`):
```
apptracker.home {
    handle /api/* {
        reverse_proxy localhost:5021
    }
    handle {
        root * /var/www/apptracker
        file_server
    }
}
```

**HTTPS (optional for internal use):**
- Use [mkcert](https://github.com/FiloSottile/mkcert) to generate a locally-trusted certificate:
  ```bash
  mkcert -install
  mkcert apptracker.home
  ```
- Point Caddy / Nginx at the generated cert/key files

---

## Phase 6 — Cutover

1. Stop using the Azure app (no new writes)
2. Export `.bacpac` from Azure SQL
3. Complete Phases 2–5 on the home server
4. Smoke test: login, view records, add/edit/delete, import Excel
5. Once verified, you can shut down / delete Azure resources

---

## What You Can Skip (Internal-Only)

| Azure concern | Home server |
|---|---|
| Azure firewall rules | Not needed — behind your home router NAT |
| GitHub Actions Azure secrets | Keep for optional future redeploy, or remove |
| Email confirmation flows | Simplify or disable if running solo |
| SSL cert renewal (Let's Encrypt) | mkcert local cert is fine internally |
| Azure Static Web Apps routing rules | Handled by your reverse proxy |

---

## Key Risk

**Data gap during cutover:** if any writes happen to Azure between your export and cutover, those records won't be in the home server DB. Since this is personal use, the fix is simple — stop using the Azure app before exporting, then cut over immediately.

---

## Estimated Effort

| Step | Time |
|---|---|
| Export + import database | 15–30 min |
| Docker SQL Server setup | 15 min |
| Backend reconfiguration | 15 min |
| Frontend rebuild + serve | 15 min |
| Networking / reverse proxy | 30–60 min (most variable) |
| **Total** | **~1.5–2 hours** |
