// ==============================================================================
// Brainnote SaaS — Automated Tenant Data Isolation Security Tests
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  assertTenantAccess,
  scopeCollectionToTenant,
  sanitizeTenantPayload,
  TenantIsolationViolationError,
  AuthenticatedSession,
} from '../src/lib/tenant-isolation';
import { Note } from '../src/types';

describe('Tenant Data Isolation Security Tests', () => {
  const tenantA: AuthenticatedSession = {
    tenantId: 'tenant-aaa-1111',
    user: {
      id: 'user-a-1',
      tenantId: 'tenant-aaa-1111',
      email: 'alex@tenant-a.com',
      name: 'Alex Rivera',
      role: 'owner',
    },
  };

  const tenantB: AuthenticatedSession = {
    tenantId: 'tenant-bbb-2222',
    user: {
      id: 'user-b-1',
      tenantId: 'tenant-bbb-2222',
      email: 'beth@tenant-b.com',
      name: 'Beth Vance',
      role: 'owner',
    },
  };

  it('allows access when session tenantId strictly matches resource tenantId', () => {
    expect(() => {
      assertTenantAccess(tenantA, 'tenant-aaa-1111');
    }).not.toThrow();
  });

  it('throws TenantIsolationViolationError when session attempts cross-tenant access', () => {
    expect(() => {
      assertTenantAccess(tenantA, 'tenant-bbb-2222');
    }).toThrow(TenantIsolationViolationError);
  });

  it('captures unauthorized attempt metadata in the security error', () => {
    try {
      assertTenantAccess(tenantA, 'tenant-bbb-2222');
      expect.fail('Should have thrown TenantIsolationViolationError');
    } catch (err) {
      expect(err).toBeInstanceOf(TenantIsolationViolationError);
      const secErr = err as TenantIsolationViolationError;
      expect(secErr.authenticatedTenantId).toBe('tenant-aaa-1111');
      expect(secErr.attemptedTenantId).toBe('tenant-bbb-2222');
      expect(secErr.userId).toBe('user-a-1');
    }
  });

  it('strictly filters collections so Tenant A only sees their own notes', () => {
    const mockNotes: Note[] = [
      {
        id: 'note-1',
        tenantId: 'tenant-aaa-1111',
        userId: 'user-a-1',
        title: "Tenant A's Confidential RoadMap",
        content: 'Secret product ideas...',
        isPinned: false,
        isArchived: false,
        tags: [],
        sources: [],
        aiArtifacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'note-2',
        tenantId: 'tenant-bbb-2222',
        userId: 'user-b-1',
        title: "Tenant B's Financial Statements",
        content: 'Confidential earnings...',
        isPinned: false,
        isArchived: false,
        tags: [],
        sources: [],
        aiArtifacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'note-3',
        tenantId: 'tenant-aaa-1111',
        userId: 'user-a-1',
        title: "Tenant A's Meeting Notes",
        content: 'Sprint planning agenda',
        isPinned: false,
        isArchived: false,
        tags: [],
        sources: [],
        aiArtifacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const notesForTenantA = scopeCollectionToTenant(mockNotes, tenantA);
    expect(notesForTenantA).toHaveLength(2);
    expect(notesForTenantA.every((n) => n.tenantId === 'tenant-aaa-1111')).toBe(true);
    expect(notesForTenantA.find((n) => n.title.includes('Financial Statements'))).toBeUndefined();

    const notesForTenantB = scopeCollectionToTenant(mockNotes, tenantB);
    expect(notesForTenantB).toHaveLength(1);
    expect(notesForTenantB[0].title).toBe("Tenant B's Financial Statements");
  });

  it('sanitizes client payloads by enforcing the authenticated session tenantId and userId', () => {
    // Malicious or accidental spoof attempt where client sends a different tenantId in the body
    const untrustedClientBody = {
      title: 'New Note',
      content: 'Hello world',
      tenantId: 'tenant-bbb-2222', // Spoofed!
      userId: 'user-evil-666',      // Spoofed!
    };

    const sanitized = sanitizeTenantPayload(untrustedClientBody, tenantA);

    // Overwritten by server session:
    expect(sanitized.tenantId).toBe('tenant-aaa-1111');
    expect(sanitized.userId).toBe('user-a-1');
    expect(sanitized.title).toBe('New Note');
  });
});
