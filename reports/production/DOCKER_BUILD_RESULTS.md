# REACT-WebFashion — Docker Build & Container Architecture Report

**Audit Date:** November 2026  
**Containerization Specialist:** Senior DevOps & Cloud Infrastructure Architect  
**Scope:** Dockerfiles, Docker Compose Orchestration, Image Optimization, Container Security  
**Status:** Validated and Production Ready

---

## 1. Containerization Architecture Overview

All core components of the **REACT-WebFashion** platform have been encapsulated into production-grade OCI-compliant container images using multi-stage builds.

```mermaid
flowchart TD
    subgraph Frontend Build [frontend/Dockerfile]
        F_Node[Stage 1: node:22-alpine<br/>Install deps & vite build] --> F_Dist[/app/dist static assets]
        F_Dist --> F_Nginx[Stage 2: nginx:1.27-alpine<br/>Unprivileged nginx user<br/>Healthcheck /healthz]
    end

    subgraph Backend API Build [back-end/Dockerfile]
        B_Deps[Stage 1: node:22-alpine<br/>npm ci --omit=dev] --> B_NodeModules[/app/node_modules]
        B_NodeModules --> B_Runner[Stage 2: node:22-alpine<br/>dumb-init PID 1 wrapper<br/>USER node<br/>Healthcheck /api/health/liveness]
    end

    subgraph Background Worker [back-end/Dockerfile.worker]
        W_Deps[Stage 1: node:22-alpine<br/>npm ci --omit=dev] --> W_Runner[Stage 2: node:22-alpine<br/>dumb-init PID 1 wrapper<br/>USER node<br/>CMD node src/worker.js]
    end
```

---

## 2. Dockerfile Specifications & Optimizations

### 2.1. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
- **Stage 1 (Builder):**
  - Base: `node:22-alpine`
  - Caches `package.json` and `package-lock.json` in a dedicated layer before copying full source.
  - Compiles Vite production bundle into `/app/dist`.
  - Supports dynamic API URL build argument: `ARG VITE_API_URL=/api`.
- **Stage 2 (Runner):**
  - Base: `nginx:1.27-alpine`
  - Copies compiled assets to `/usr/share/nginx/html`.
  - Uses `frontend/nginx.conf` with gzip compression, SPA fallback (`try_files $uri $uri/ /index.html`), and immutable 1-year asset caching for `/assets/`.
  - Non-root file ownership applied to user `nginx`.
  - Built-in healthcheck: `wget -q --spider http://127.0.0.1:80/healthz || exit 1`.
  - **Estimated Image Size:** ~45 MB (vs > 1.2 GB if running via Node.js).

### 2.2. Backend HTTP API Dockerfile (`back-end/Dockerfile`)
- **Stage 1 (Dependencies):**
  - Base: `node:22-alpine`
  - Resolves only production runtime dependencies via `npm ci --omit=dev`.
- **Stage 2 (Runtime):**
  - Base: `node:22-alpine`
  - Installs `dumb-init` to properly reap zombie processes and forward `SIGTERM`/`SIGINT` signals.
  - Drops root privileges: `USER node`.
  - Built-in healthcheck: Native Node.js HTTP fetch against `http://127.0.0.1:5000/api/health/liveness`.
  - **Estimated Image Size:** ~180 MB.

### 2.3. Background Worker Dockerfile (`back-end/Dockerfile.worker`)
- Shares the hardened `dumb-init` base and production dependencies of the API image.
- Entrypoint initiates `node src/worker.js` to execute BullMQ consumers (`emailQueue`, `trackingQueue`, `vectorQueue`).
- Safe termination: `dumb-init` guarantees that in-flight email deliveries or batch tracking jobs drain before shutdown.

---

## 3. Docker Compose Orchestration Matrix

Configuration validated via `docker compose -f docker-compose.production.yml config`:

| Service | Image / Build Source | Ports | CPU Limit | Memory Limit | Restart Policy | Healthcheck |
|---|---|---|---|---|---|---|
| `reverse-proxy` | `nginx:1.27-alpine` | `80:80`, `443:443` | 1.0 CPU | 256 MB | `unless-stopped` | `wget http://127.0.0.1/healthz` |
| `frontend` | `./frontend/Dockerfile` | Internal: `80` | 0.5 CPU | 256 MB | `unless-stopped` | `wget http://127.0.0.1:80/healthz` |
| `api` | `./back-end/Dockerfile` | Internal: `5000` | 2.0 CPU | 1024 MB | `unless-stopped` | `node fetch /api/health/liveness` |
| `worker` | `./back-end/Dockerfile.worker`| None (worker) | 1.0 CPU | 512 MB | `unless-stopped` | Process loop |
| `mongo` | `mongo:7.0` | Internal: `27017`| 2.0 CPU | 1536 MB | `unless-stopped` | `mongosh db.adminCommand('ping')`|
| `redis` | `redis:7-alpine` | Internal: `6379` | 0.5 CPU | 512 MB | `unless-stopped` | `redis-cli -a *** ping` |

### 3.1. Logging Controls
Every service is governed by Docker's `json-file` logging driver with strict size limits:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "20m" # (50m for api/mongo)
    max-file: "5"
```
This guarantees log files never consume more than 100MB–250MB per container, eliminating unmonitored disk exhaustion incidents.

### 3.2. Network Isolation
All services communicate over private bridge network `webfashion-prod-net`. Only the reverse proxy maps host ports (`80` and `443`). MongoDB, Redis, and internal service ports are completely unreachable from external networks.

---

## 4. Verification Verdict

**CONTAINER STATUS: VERIFIED AND APPROVED FOR PRODUCTION**  
All container images adhere to production security benchmarks, resource limits, and automated health checks.
