# PhotoAI

Web application for private photo uploads and Nano Banana image editing through OpenRouter. It uses React/Vite, Express, PostgreSQL, Google and Telegram login, and quota-limited local image storage.

## Local development

1. Install Node.js 22 and run `npm ci`.
2. Copy `.env.example` to `.env` and fill the required values. The development command loads this file automatically.
3. Apply the database schema with `npm run db:migrate`.
4. Start the full Express + Vite application with `npm run dev`.
5. Open `http://127.0.0.1:5080`. Do not use a standalone Vite server on port `5173` when testing authentication because it does not serve the `/api` routes.

### Local Google sign-in

The existing Google OAuth client can be used for local development without adding an authentication bypass:

1. Add `http://127.0.0.1:5080/api/auth/google/callback` to the client's **Authorized redirect URIs** in Google Cloud.
2. Put the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the untracked local `.env` file.
3. Set `GOOGLE_REDIRECT_URI=http://127.0.0.1:5080/api/auth/google/callback` in `.env`.
4. Use a development database URL and a separate random `SESSION_SECRET` of at least 32 characters.

Telegram login remains tied to the production bot domain. Use Google for routine local authentication and verify Telegram on the deployed HTTPS domain.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Vite and Express development server |
| `npm test` | Run unit tests |
| `npm run check` | Type-check client and server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run db:migrate` | Apply committed PostgreSQL migrations |
| `npm start` | Run the production bundle |

## Production architecture

The application listens only on `127.0.0.1:5080`. Caddy terminates HTTPS and proxies the public domain to it. PostgreSQL stores users, sessions, projects and edit metadata. Original images and thumbnails stay in private persistent VPS storage and are served through application authorization checks.

See [docs/deployment.md](docs/deployment.md) for deployment, credentials and rollback procedures. The rationale for the production architecture is recorded in [ADR-001](docs/decisions/001-vps-production-architecture.md).
