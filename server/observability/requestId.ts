import { randomUUID } from "node:crypto";

const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveRequestId(candidate?: string): string {
  return candidate && CANONICAL_UUID.test(candidate)
    ? candidate.toLowerCase()
    : randomUUID();
}
