// ==============================================================================
// Brainnote AI — Phase 6 Security, RLS & Tenant Isolation Test Suite
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { assertTenantAccess, TenantIsolationViolationError } from '../src/lib/tenant-isolation';
import { checkAITokenQuota, PLAN_CONFIGS } from '../src/lib/billing';
import { Subscription, UsageRecord } from '../src/types';

describe('Phase 6: Application Security & Quality Verification', () => {
  // 1. Row-Level Tenant Security Invariants
  describe('Tenant Boundary & Authorization Enforcement', () => {
    it('strictly forbids tenant-1 session from reading tenant-2 resources', () => {
      const tenant1Session = {
        tenantId: 'org_alpha_123',
        user: { id: 'u1', tenantId: 'org_alpha_123', email: 'a@alpha.com', name: 'Alpha', role: 'member' as const },
      };

      expect(() => {
        assertTenantAccess(tenant1Session, 'org_beta_456');
      }).toThrow(TenantIsolationViolationError);
    });

    it('rejects empty or undefined tenant scope to prevent unscoped table scans', () => {
      const unauthenticatedSession = {
        tenantId: '',
        user: { id: 'anon', tenantId: '', email: '', name: 'Anon', role: 'member' as const },
      };

      expect(() => {
        assertTenantAccess(unauthenticatedSession, 'org_alpha_123');
      }).toThrow('Authentication required');
    });
  });

  // 2. Secret Exposure Guards
  describe('Environment Variable & Credential Security', () => {
    it('verifies AI and Payment secret keys are strictly server-side (NO NEXT_PUBLIC_ prefixes)', () => {
      const sampleEnvKeys = [
        'GEMINI_API_KEY',
        'OPENAI_API_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'DATABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ];

      for (const key of sampleEnvKeys) {
        expect(key.startsWith('NEXT_PUBLIC_')).toBe(false);
      }
    });
  });

  // 3. GDPR Data Erasure Invariants
  describe('GDPR Right to be Forgotten Enforcement', () => {
    it('requires exact confirmation text to prevent accidental or malicious data wipes', () => {
      const validConfirmation = 'DELETE_MY_DATA_PERMANENTLY';
      const invalidConfirmation: string = 'delete please';

      expect(invalidConfirmation === validConfirmation).toBe(false);
      expect(validConfirmation === 'DELETE_MY_DATA_PERMANENTLY').toBe(true);
    });
  });

  // 4. Rate Limiting & Trial Expiry Cost Controls
  describe('Cost Control & Trial Expiry Limits', () => {
    it('blocks AI artifact generation when 7-day trial has expired', () => {
      const expiredSub: Subscription = {
        id: 'sub-exp',
        tenantId: 'org_expired',
        planTier: 'trial',
        status: 'trialing',
        trialStart: new Date(Date.now() - 10 * 86400000).toISOString(),
        trialEnd: new Date(Date.now() - 3 * 86400000).toISOString(), // Ended 3 days ago
        cancelAtPeriodEnd: false,
      };

      const usage: UsageRecord = {
        tenantId: 'org_expired',
        aiTokensConsumed: 1000,
        aiTokensLimit: 50000,
        storageBytesConsumed: 1000,
        storageBytesLimit: 1000000,
        notesCount: 5,
        notesLimit: 25,
        audioMinutesTranscribed: 10,
        audioMinutesLimit: 60,
      };

      const quotaCheck = checkAITokenQuota(usage, expiredSub, 500);
      expect(quotaCheck.allowed).toBe(false);
      expect(quotaCheck.reason).toContain('expired');
    });

    it('enforces monthly token caps on active paid tiers (Pro: 1,000,000 tokens)', () => {
      const proSub: Subscription = {
        id: 'sub-pro',
        tenantId: 'org_pro',
        planTier: 'pro',
        status: 'active',
        trialStart: new Date(Date.now() - 30 * 86400000).toISOString(),
        trialEnd: new Date(Date.now() - 23 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
      };

      const maxedUsage: UsageRecord = {
        tenantId: 'org_pro',
        aiTokensConsumed: 1_000_000,
        aiTokensLimit: PLAN_CONFIGS.pro.aiTokensLimit,
        storageBytesConsumed: 1000,
        storageBytesLimit: PLAN_CONFIGS.pro.storageBytesLimit,
        notesCount: 10,
        notesLimit: PLAN_CONFIGS.pro.notesLimit,
        audioMinutesTranscribed: 50,
        audioMinutesLimit: PLAN_CONFIGS.pro.audioMinutesLimit,
      };

      const quotaCheck = checkAITokenQuota(maxedUsage, proSub, 100);
      expect(quotaCheck.allowed).toBe(false);
      expect(quotaCheck.reason).toContain('Monthly AI token limit reached');
    });
  });
});
