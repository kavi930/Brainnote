// ==============================================================================
// Brainnote AI — Deterministic UUID & Tenant Identifier Adapter
// Bridges human-readable IDs with PostgreSQL strict UUID columns
// ==============================================================================

import crypto from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the string is already a valid RFC4122 UUID.
 */
export function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Well-known system namespace mappings
const FIXED_UUID_MAP: Record<string, string> = {
  'tenant-acme': '00000000-0000-0000-0000-000000000001',
  'user-alex': '00000000-0000-0000-0000-000000000002',
};

/**
 * Converts any arbitrary string ID into a deterministic, valid UUID.
 * Guarantees that the same input string ALWAYS maps to the same UUID.
 */
export function toDeterministicUuid(id: string): string {
  if (!id) return '00000000-0000-0000-0000-000000000000';
  
  // Return directly if already a valid UUID
  if (isUuid(id)) return id.toLowerCase();

  // Check well-known static mappings
  if (FIXED_UUID_MAP[id]) return FIXED_UUID_MAP[id];

  // Generate deterministic UUID v5-style MD5 hash
  const hash = crypto.createHash('md5').update(`brainnote:${id}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`, // set version 4
    `a${hash.slice(17, 20)}`, // set variant 10xx
    hash.slice(20, 32),
  ].join('-');
}
