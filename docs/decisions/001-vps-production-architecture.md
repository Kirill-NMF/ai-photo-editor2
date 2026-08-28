# ADR-001: VPS production architecture

## Status

Accepted

## Date

2026-08-28

## Context

The original application depended on platform-specific OIDC, a proprietary object-storage sidecar and a vendor-specific database transport. Production must run on an existing VPS without disturbing other services, use a clean database, support Google and Telegram login, keep user images private, and use Nano Banana through OpenRouter for image editing.

## Decision

- Run one Node.js process under systemd, bound to `127.0.0.1:5080`.
- Reuse the VPS Caddy and PostgreSQL services; isolate the app with its own Unix user, database role, database and environment file.
- Terminate HTTPS in Caddy and expose only `ai-photo-editor.store` publicly.
- Use standards-based Google OpenID Connect and Telegram Login Widget verification with server-side PostgreSQL sessions.
- Store images privately on the VPS under `/var/lib/ai-photo-editor/storage`, behind application owner/ACL checks. Enforce a 15 GiB application quota, reject writes at the limit, and never auto-delete user files.
- Use committed Drizzle migrations and release directories with an atomic `current` symlink.
- Use OpenRouter's Image API with the fixed model `google/gemini-2.5-flash-image` (Nano Banana). Send private source images as base64 data URLs and validate returned raster data before storage.

## Alternatives considered

### Docker Compose

Rejected for the first release because PostgreSQL and Caddy already run on the host, and adding duplicate infrastructure would increase operational complexity without improving isolation enough for this single process.

### External object storage and public URLs

Deferred because the VPS currently has enough disk for the requested 15 GiB allocation and an extra paid service is unnecessary for the first release. Public object URLs were rejected because original user images must not be publicly enumerable or retrievable. Application-mediated reads keep authorization in one place.

### Copying legacy hosted data

Rejected because the requested launch is a clean start. The migration endpoint and legacy-provider compatibility code were removed.

## Consequences

- Local storage must be backed up with the database and monitored for capacity; reaching the configured limit rejects new writes without deleting existing images.
- The environment file contains all service credentials and must be readable only by root and the application group.
- A release is promoted only after tests, type checking, build, migration and local health checks pass.
- Future database migrations must remain backward-compatible with the immediately previous release so the application symlink can be rolled back safely.
