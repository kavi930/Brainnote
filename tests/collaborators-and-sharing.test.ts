// ==============================================================================
// Brainnote AI — Collaborators, Team Sharing & Multi-User Access Tests
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { 
  getCollaborators, 
  inviteCollaborator, 
  removeCollaborator 
} from '../src/lib/server-store';

describe('Collaborators, Team Sharing & Multi-User Access', () => {
  it('fetches existing collaborators for a tenant', () => {
    const collabs = getCollaborators('tenant-acme');
    expect(Array.isArray(collabs)).toBe(true);
    expect(collabs.length).toBeGreaterThanOrEqual(1);
    expect(collabs.some((c) => c.email === 'alex@acmelabs.ai')).toBe(true);
  });

  it('invites a new collaborator with Editor role and active timestamp', () => {
    const testEmail = `collaborator-${Date.now()}@example.com`;
    const newCollab = inviteCollaborator('tenant-acme', testEmail, 'Jordan Lee', 'editor');

    expect(newCollab).toBeDefined();
    expect(newCollab.email).toBe(testEmail.toLowerCase());
    expect(newCollab.role).toBe('editor');
    expect(newCollab.status).toBe('invited');
    expect(newCollab.invitedAt).toBeDefined();

    const collabsAfter = getCollaborators('tenant-acme');
    expect(collabsAfter.some((c) => c.email === testEmail.toLowerCase())).toBe(true);
  });

  it('updates role if the same email is re-invited without creating duplicates', () => {
    const testEmail = `duplicate-test-${Date.now()}@example.com`;
    inviteCollaborator('tenant-acme', testEmail, 'Sam', 'viewer');
    const updated = inviteCollaborator('tenant-acme', testEmail, 'Sam', 'editor');

    expect(updated.role).toBe('editor');
    const matches = getCollaborators('tenant-acme').filter((c) => c.email === testEmail.toLowerCase());
    expect(matches.length).toBe(1);
  });

  it('revokes access when removeCollaborator is called', () => {
    const testEmail = `remove-test-${Date.now()}@example.com`;
    const collab = inviteCollaborator('tenant-acme', testEmail, 'Temporary User', 'viewer');

    const removed = removeCollaborator('tenant-acme', collab.id);
    expect(removed).toBe(true);

    const collabs = getCollaborators('tenant-acme');
    expect(collabs.some((c) => c.id === collab.id)).toBe(false);
  });

  it('enforces tenant isolation so collaborators in tenant A do not leak into tenant B', () => {
    const tenantAEmail = `tenant-a-user-${Date.now()}@tenant-a.com`;
    inviteCollaborator('tenant-isolated-1', tenantAEmail, 'User A', 'editor');

    const tenantBCollabs = getCollaborators('tenant-isolated-2');
    expect(tenantBCollabs.some((c) => c.email === tenantAEmail)).toBe(false);
  });
});
