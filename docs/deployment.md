# Production deployment

## Required external configuration

Create `/etc/ai-photo-editor/ai-photo-editor.env` with mode `0640`, owned by `root:photoeditor`. Use `.env.example` as the field list. Production values must include:

- `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=5080`, `PUBLIC_BASE_URL=https://ai-photo-editor.store`
- the dedicated PostgreSQL `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters
- Google OAuth client ID and secret; authorized origin `https://ai-photo-editor.store`; redirect URI `https://ai-photo-editor.store/api/auth/google/callback`
- Telegram bot token and username; set the bot login domain to `ai-photo-editor.store` in BotFather
- `LOCAL_STORAGE_DIR=/var/lib/ai-photo-editor/storage` and `LOCAL_STORAGE_LIMIT_BYTES=16106127360` (15 GiB)
- Gemini API key
- optional private promo code; leave `PROMO_CODE` empty to disable it

Create the storage directory once with `install -d -m 0700 -o photoeditor -g photoeditor /var/lib/ai-photo-editor/storage`. It is deliberately outside release directories so releases and rollbacks cannot erase user images. When the 15 GiB application limit is reached, new uploads and generated images receive HTTP 507; existing files are retained.

The legacy database credential from the former hosted environment must be revoked even though its configuration file is no longer part of this release.

## Release procedure

1. Create the persistent storage directory if it does not exist, then create a timestamped directory under `/opt/ai-photo-editor/releases/` and copy a clean source checkout into it.
2. Run `npm ci`, `npm test`, `npm run check`, and `npm run build` in the release directory.
3. Load the production environment and run `npm run db:migrate`.
4. Point `/opt/ai-photo-editor/current` atomically at the new release.
5. Install `deploy/ai-photo-editor.service` as `/etc/systemd/system/ai-photo-editor.service`, reload systemd, and restart the service.
6. Add the blocks from `deploy/Caddyfile` to the existing Caddy configuration, validate it, and reload Caddy.
7. Verify `/healthz`, `/readyz`, Google login, Telegram login, upload, one Gemini edit, thumbnail display and logout.

Never replace the complete VPS Caddyfile or stop unrelated services during this deployment.

## Rollback

Point `/opt/ai-photo-editor/current` back to the previous release symlink target and restart `ai-photo-editor.service`. Validate `/healthz` and `/readyz`. Do not reverse database migrations automatically; production migrations must be compatible with the previous application release.
