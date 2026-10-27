// ==============================================================================
// Brainnote SaaS — Tenant Isolation & Security Boundary Enforcer
// ==============================================================================

import { User } from '@/types';

export class TenantIsolationViolationError extends Error {
  public readonly attemptedTenantId: string;
  public readonly authenticatedTenantId: string;
  public readonly userId: string;

  constructor(authenticatedTenantId: string, attemptedTenantId: string, userId: string) {
    super(
      `SECURITY ALERT: Cross-tenant data access violation detected! User '${userId}' belonging to Tenant '${authenticatedTenantId}' attempted unauthorized access to Tenant '${attemptedTenantId}'.`
    );
    this.name = 'TenantIsolationViolationError';
    this.attemptedTenantId = attemptedTenantId;
    this.authenticatedTenantId = authenticatedTenantId;
    this.userId = userId;
  }
}

export interface AuthenticatedSession {
  user: User;
  tenantId: string;
}

/**
 * Validates that an authenticated session is allowed to access or mutate a resource.
 * Throws a TenantIsolationViolationError if the tenant IDs do not strictly match.
 */
export function assertTenantAccess(
  session: AuthenticatedSession,
  targetResourceTenantId: string
): void {
  if (!session || !session.tenantId) {
    throw new Error('Authentication required: Missing valid session tenant context.');
  }

  if (session.tenantId !== targetResourceTenantId) {
    throw new TenantIsolationViolationError(
      session.tenantId,
      targetResourceTenantId,
      session.user.id
    );
  }
}

/**
 * Produces a type-safe filter predicate for filtering in-memory or ORM query collections.
 * Guarantees that records from other tenants are filtered out.
 */
export function scopeCollectionToTenant<T extends { tenantId: string }>(
  items: T[],
  session: AuthenticatedSession
): T[] {
  if (!session || !session.tenantId) {
    return [];
  }
  return items.filter((item) => item.tenantId === session.tenantId);
}

/**
 * Attaches the verified tenant ID to any newly created record,
 * preventing client-side spoofing of the tenant ID.
 */
export function sanitizeTenantPayload<T extends Record<string, unknown>>(
  payload: T,
  session: AuthenticatedSession
): T & { tenantId: string; userId: string } {
  if (!session || !session.tenantId || !session.user) {
    throw new Error('Cannot sanitize payload without active authenticated session.');
  }

  return {
    ...payload,
    tenantId: session.tenantId, // Overwrite any tenantId passed from client
    userId: session.user.id,     // Enforce creating user ownership
  };
}
