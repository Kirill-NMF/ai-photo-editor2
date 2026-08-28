# PhotoAI

Web application for private photo uploads and Gemini-powered image editing. It uses React/Vite, Express, PostgreSQL, Google and Telegram login, and quota-limited local image storage.

## Local development

1. Install Node.js 22 and run `npm ci`.
2. Copy `.env.example` to `.env` and fill the required values.
3. Apply the database schema with `npm run db:migrate`.
4. Start the application with `npm run dev`.

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
