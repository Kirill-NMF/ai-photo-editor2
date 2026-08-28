# Implementation Plan: Local image storage

## Overview

Replace the external S3 adapter with persistent local VPS storage capped at 15 GiB while preserving the current application object paths, authorization model, thumbnails, and edit workflow.

## Architecture decisions

- Use an application-enforced quota because the shared ext4 root filesystem was not mounted with quota support; remounting it would risk unrelated services.
- Store files outside timestamped releases in `/var/lib/ai-photo-editor/storage`.
- Use Uppy XHRUpload against an authenticated same-origin Express endpoint.
- Reject new writes with HTTP 507 at the quota boundary and never evict existing files.

## Task list

### Phase 1: Storage foundation

- [x] Task 1: Add local path confinement, metadata, atomic file operations, and quota enforcement with filesystem tests.
- [x] Task 2: Replace S3 environment configuration with local directory and 15 GiB limit configuration.

### Checkpoint: Foundation

- [x] Focused storage and configuration tests pass.

### Phase 2: Upload and processing flow

- [ ] Task 3: Add authenticated HTTP upload handling and preserve owner ACL checks.
- [ ] Task 4: Adapt generated edits and thumbnails to local files.
- [ ] Task 5: Replace the browser S3 uploader plugin with XHRUpload.

### Checkpoint: Core flow

- [ ] Full tests and type checking pass.
- [ ] Upload, private read, thumbnail, and edit paths use application URLs only.

### Phase 3: Production delivery

- [ ] Task 6: Remove S3 dependencies and update environment, deployment docs, and systemd write access.
- [ ] Task 7: Build, audit, deploy a new disabled release, and smoke-test local storage on the VPS.

### Checkpoint: Complete

- [ ] All success criteria pass and rollback remains available.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Path traversal or symlink escape | High | Strict key validation, resolved-root checks, no user-provided paths |
| Concurrent writes exceed quota | High | Serialize quota-changing filesystem operations |
| Partial file after interruption | Medium | Write to a temporary sibling and atomically rename |
| Shared VPS disk fills | High | 15 GiB application cap plus deployment disk-space check |
| Release rollback expects S3 | Medium | Keep the prior release and do not start public service until the new flow passes |

## Open questions

None.
