# Application Restart Procedure

This runbook documents a full shutdown and restart of the containerized application stack.

## Scope

- Frontend service
- Backend service
- Infrastructure services (Postgres, Redis)

## Prerequisites

- Docker Desktop is running.
- You are in the repository root:

```bash
cd /Users/anton.minnie/agents_testing
```

## 1) Full Shutdown

Stop app services:

```bash
npm run app:down
```

Stop infrastructure services and remove compose network:

```bash
npm run infra:down
```

Verify everything is down:

```bash
docker compose ps
```

Expected: no running services listed.

## 2) Full Restart

Start full stack (app + required infra dependencies) using explicit host ports:

```bash
BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up
```

Check app container status:

```bash
npm run app:ps
```

Wait until both app services show `healthy`.

## 3) Health Verification

Verify backend health endpoint and frontend HTTP response:

```bash
node -e "const urls=['http://localhost:4400/health','http://localhost:5188'];(async()=>{for(const url of urls){const r=await fetch(url);console.log(url,r.status);} })().catch((e)=>{console.error(e.message);process.exit(1);});"
```

Expected:

- `http://localhost:4400/health 200`
- `http://localhost:5188 200`

## 3.1) Frontend Login URL

After restart, open the frontend in your browser to log in:

- If using the documented restart ports in this runbook:
  - `http://localhost:5188`
- If using default frontend port mapping:
  - `http://localhost:5173`

Login screen is the default route at the frontend base URL.

Backend health endpoint quick reference:

- If using the documented restart ports in this runbook:
  - `http://localhost:4400/health`
- If using default backend port mapping:
  - `http://localhost:4000/health`

## 4) Troubleshooting

### Port already in use

If startup fails because `:4000` or `:5173` is occupied, use alternate host ports:

```bash
BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up
```

### Transient Docker network/container mismatch

If you see a message similar to `failed to set up container networking ... network ... not found`:

1. Tear down compose resources:

```bash
docker compose down
```

2. Remove stale app containers (if present):

```bash
docker rm -f happyvibes-backend happyvibes-frontend
```

3. Start again:

```bash
BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up
```

4. Re-check:

```bash
npm run app:ps
```

## 5) Optional Operational Commands

Tail app logs:

```bash
npm run app:logs
```

Restart app services without tearing down infra:

```bash
npm run app:restart
```
