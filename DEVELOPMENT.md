# Development guide

## Getting start
npm install

cp env.example .env
# Edit .env with your configuration

npm run docker:up
npm run db:migrate
npm run db:generate
npm run dev


# Create demo users and corporations:
npm run prisma:seed

#####

This file explains how to run the Spectrum Map Platform in development mode on Windows (PowerShell) and how to quickly verify backend and frontend changes using the local dev servers and Docker Compose.

## Quick overview

- Backend: NestJS app in `apps/backend` — runs on port 3000 by default
- Frontend: Vue 3 app in `apps/frontend` — Vite dev server runs on port 5173 by default
- Database: Postgres + PostGIS (Docker Compose service `database`)
- GeoServer: (Docker Compose service `geoserver`)

There are two common workflows:

1. Local Node development (recommended for fast edit/test)
2. Containerized development using Docker Compose (recommended if you need PostGIS/GeoServer locally)

## Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose (if using docker workflow)
- Git

## 1) Run both servers locally (fast)

Open PowerShell at the repository root and run:

```powershell
npm install
npm run db:generate # optional: generates prisma client
npm run dev
```

This runs both frontend and backend concurrently (root `package.json` delegates to `apps/backend` and `apps/frontend`).

Where to view things:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

Notes:
- Backend uses `start:dev` (Nest's --watch) so TypeScript changes in `apps/backend/src` will restart the server.
- Frontend uses Vite so changes in `apps/frontend/src` will hot-reload (HMR) instantly in the browser.

## 2) Run with Docker Compose (database + geoserver)

Use this when you need PostGIS or GeoServer locally.

```powershell
# start supporting services and app containers
npm run docker:up

# view logs
npm run docker:logs

# when done
npm run docker:down
```

If you prefer to start only PostGIS and GeoServer and run your Node servers locally, you can edit `.env` to point `DATABASE_URL` to the docker `database` host and run the servers locally.

## Verifying changes (examples)

Below are small, safe edits you can make to confirm frontend and backend changes are wired up.

Backend quick test (health endpoint):

1. Open `apps/backend/src/app.service.ts`.
2. Change the return value of `getHello()` to a different message, e.g. `return 'Backend change: dev test';`.
3. Save the file. Nest (start:dev) will restart automatically.
4. In your browser or using curl, call the endpoint:

```powershell
# Browser: http://localhost:3000/api/v1
# or PowerShell curl
Invoke-RestMethod http://localhost:3000/api/v1
```

You should see your new message in the response.

Detailed health endpoint:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health | ConvertTo-Json -Depth 5
```

Frontend quick test (UI HMR):

1. Open `apps/frontend/src/App.vue`.
2. Add a small visual indicator, for example modify the container in the template to include a version badge:

```html
<div id="app" class="min-h-screen bg-gray-50">
  <div class="p-4 text-sm text-gray-600">Dev build: edit to verify HMR</div>
  <RouterView />
</div>
```

3. Save the file. Vite HMR will update the browser automatically.

If the browser doesn't update, check the console for HMR errors and ensure the dev server is running (`npm run dev` in root or `cd apps/frontend; npm run dev`).

## Verifying that backend and frontend are talking

The frontend uses `VITE_API_URL` (in Docker it's set to `http://localhost:3000/api/v1`). To verify end-to-end:

1. Start backend and frontend locally.
2. Open the browser devtools Network tab.
3. Trigger an action in the UI that calls the API (login or open a map list). Observe requests to `http://localhost:3000/api/v1/..` and inspect responses.

If CORS errors appear, check the backend's `main.ts` `enableCors` origin setting and the `CORS_ORIGIN` environment variable.

## Common troubleshooting

- Ports already in use: ensure nothing blocks 5173 or 3000. Use `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess` to inspect on PowerShell if needed.
- Prisma / DB errors: run `npm run db:generate` and `npm run db:migrate` from `apps/backend`.
- Native modules (sharp, gdal-async): Install dev toolchains or use Docker if native builds fail on Windows.

## Quick checklist for code changes

- Backend (API changes)
  - Run `cd apps/backend; npm run start:dev`
  - Edit code in `apps/backend/src` and confirm endpoint response and logs
  - Run unit tests: `cd apps/backend; npm run test`

- Frontend (UI changes)
  - Run `cd apps/frontend; npm run dev`
  - Edit components in `apps/frontend/src` and confirm HMR in browser
  - Run type checks: `cd apps/frontend; npm run type-check`

## Example verification tasks (copy/paste)

# 1) Backend edit and test
```powershell
# from repo root
cd .\apps\backend
npm run start:dev
# edit file apps/backend/src/app.service.ts (change text), then in another shell:
Invoke-RestMethod http://localhost:3000/api/v1
```

# 2) Frontend HMR
```powershell
cd .\apps\frontend
npm run dev
# open http://localhost:5173 and edit apps/frontend/src/App.vue - changes should appear live
```

## Next steps / suggestions

- Add a CONTRIBUTING.md with linter/test hooks
- Add small example test suites (backend: health endpoint; frontend: snapshot or unit test)
- Add instructions for running Prisma locally if you contribute schema changes

---

If you'd like, I can:
- Make the two verification edits for you as a demo (change backend hello message and add the dev badge in App.vue), then run the dev servers and show the responses.
- Add a small Jest test for the backend health endpoint.
