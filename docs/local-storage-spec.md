# Spec: Local image storage

## Objective

Store Photo Editor originals, generated images, and thumbnails on the existing VPS without an external object-storage service. Storage must remain private, survive application releases, stop accepting new files at 15 GiB, and never delete existing files automatically.

## Tech stack

- Node.js, Express, TypeScript, React, and Uppy
- Local ext4 filesystem under `/var/lib/ai-photo-editor/storage`
- Existing PostgreSQL database for users, sessions, projects, image metadata, and edit metadata only

## Commands

- Install: `npm ci`
- Focused tests: `npm test -- tests/localStorage.test.ts tests/config.test.ts`
- Full tests: `npm test`
- Type check: `npm run check`
- Build: `npm run build`
- Dependency audit: `npm audit --omit=dev`

## Project structure

- `server/storage/` contains local path, quota, and upload validation primitives.
- `server/objectStorage.ts` exposes provider-independent file operations used by routes and thumbnails.
- `server/routes.ts` owns authenticated upload and download endpoints.
- `client/src/components/ObjectUploader.tsx` sends files to the application server.
- `tests/` proves path confinement, quota behavior, configuration, and upload validation.
- `deploy/` and `docs/deployment.md` define the persistent server directory and systemd access.

## Code style

Use small typed functions, explicit error classes, and application paths that never expose filesystem paths:

```ts
const objectPath = objectPathFromKey(`uploads/${uploadId}`);
await storage.saveObject(objectPath, body, contentType);
```

## Testing strategy

- Unit tests use temporary directories and real filesystem operations.
- Tests cover path traversal, quota boundaries, atomic writes, unsupported image data, and configuration defaults.
- The full suite, type check, production build, dependency audit, and a VPS smoke test gate deployment.

## Boundaries

- Always: authenticate uploads and private downloads; limit each image to 10 MiB; verify MIME type and actual image contents; write atomically; enforce the 15 GiB application quota; keep storage outside release directories.
- Ask first: changing the 15 GiB quota, adding automatic deletion, moving files to another host, or enabling public originals.
- Never: store image bytes in PostgreSQL, accept client filesystem paths, follow symlinks outside the storage root, delete old files automatically, or expose filesystem paths in API responses.

## Success criteria

- The application starts without S3 settings or SDKs.
- Authenticated users can upload JPEG, PNG, and WebP images up to 10 MiB.
- Private originals and generated edits remain owner-protected; public thumbnails retain their current behavior.
- Writes that would exceed 15 GiB fail without modifying existing files.
- Releases do not remove files under `/var/lib/ai-photo-editor/storage`.
- No changes are made to ShortTalk or unrelated VPS services.

## Open questions

None. The user approved rejecting new uploads at the limit and preserving all existing files.
