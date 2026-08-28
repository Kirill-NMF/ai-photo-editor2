# ADR-001: VPS production architecture

## Status

Accepted

## Date

2026-08-28

## Context

The original application depended on platform-specific OIDC, a proprietary object-storage sidecar and a vendor-specific database transport. Production must run on an existing VPS without disturbing other services, use a clean database, support Google and Telegram login, keep user images private, and use Gemini as the only image-editing provider.

## Decision

- Run one Node.js process under systemd, bound to `127.0.0.1:5080`.
- Reuse the VPS Caddy and PostgreSQL services; isolate the app with its own Unix user, database role, database and environment file.
- Terminate HTTPS in Caddy and expose only `ai-photo-editor.store` publicly.
- Use standards-based Google OpenID Connect and Telegram Login Widget verification with server-side PostgreSQL sessions.
- Use the AWS SDK v3 against a private Beget S3-compatible bucket. Browser uploads use 15-minute presigned PUT URLs; reads pass through owner/ACL checks in the application.
- Use committed Drizzle migrations and release directories with an atomic `current` symlink.
- Support only Gemini for image editing.

## Alternatives considered

### Docker Compose

Rejected for the first release because PostgreSQL and Caddy already run on the host, and adding duplicate infrastructure would increase operational complexity without improving isolation enough for this single process.

### Public bucket URLs

Rejected because original user images must not be publicly enumerable or retrievable. Application-mediated reads keep authorization in one place.

### Copying legacy hosted data

Rejected because the requested launch is a clean start. The migration endpoint and legacy-provider compatibility code were removed.

## Consequences

- Beget bucket CORS must permit browser PUT requests from the production origin.
- The environment file contains all service credentials and must be readable only by root and the application group.
- A release is promoted only after tests, type checking, build, migration and local health checks pass.
- Future database migrations must remain backward-compatible with the immediately previous release so the application symlink can be rolled back safely.
