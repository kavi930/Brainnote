// ==============================================================================
// Brainnote SaaS — Automated Billing, Trial & Quota Enforcement Tests
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { getTrialStatus, checkAITokenQuota, PLAN_CONFIGS } from '../src/lib/billing';
import { Subscription, UsageRecord } from '../src/types';

describe('Billing, 7-Day Trial & Quota Enforcement Tests', () => {
  const baseTime = new Date('2026-10-26T12:00:00Z');

  const activeTrialSubscription: Subscription = {
    id: 'sub-trial-1',
    tenantId: 'tenant-123',
    planTier: 'trial',
    status: 'trialing',
    trialStart: '2026-10-23T12:00:00Z',
    trialEnd: '2026-10-30T12:00:00Z', // 4 days remaining from baseTime
    cancelAtPeriodEnd: false,
  };

  const expiredTrialSubscription: Subscription = {
    id: 'sub-trial-expired',
    tenantId: 'tenant-expired',
    planTier: 'trial',
    status: 'trialing',
    trialStart: '2026-10-10T12:00:00Z',
    trialEnd: '2026-10-17T12:00:00Z', // Expired relative to baseTime
    cancelAtPeriodEnd: false,
  };

  const activeProSubscription: Subscription = {
    id: 'sub-pro-1',
    tenantId: 'tenant-pro',
    planTier: 'pro',
    status: 'active',
    trialStart: '2026-09-01T00:00:00Z',
    trialEnd: '2026-09-08T00:00:00Z',
    currentPeriodEnd: '2026-11-01T00:00:00Z',
    cancelAtPeriodEnd: false,
  };

  it('correctly calculates remaining trial days and active status', () => {
    const status = getTrialStatus(activeTrialSubscription, baseTime);
    expect(status.isActive).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.daysRemaining).toBe(4);
    expect(status.formattedTimeRemaining).toBe('4 days left');
  });

  it('flags an expired trial accurately', () => {
    const status = getTrialStatus(expiredTrialSubscription, baseTime);
    expect(status.isActive).toBe(false);
    expect(status.isExpired).toBe(true);
    expect(status.formattedTimeRemaining).toBe('Trial Expired');
  });

  it('allows AI token consumption when within trial token quota', () => {
    const usage: UsageRecord = {
      tenantId: 'tenant-123',
      aiTokensConsumed: 12_000,
      aiTokensLimit: PLAN_CONFIGS.trial.aiTokensLimit, // 50,000
      storageBytesConsumed: 10 * 1024 * 1024,
      storageBytesLimit: PLAN_CONFIGS.trial.storageBytesLimit,
      notesCount: 5,
      notesLimit: PLAN_CONFIGS.trial.notesLimit,
      audioMinutesTranscribed: 10,
      audioMinutesLimit: PLAN_CONFIGS.trial.audioMinutesLimit,
    };

    const quotaResult = checkAITokenQuota(usage, activeTrialSubscription, 2000, baseTime);
    expect(quotaResult.allowed).toBe(true);
    expect(quotaResult.percentUsed).toBe(24);
  });

  it('rejects AI token consumption if requested tokens exceed trial limit', () => {
    const usage: UsageRecord = {
      tenantId: 'tenant-123',
      aiTokensConsumed: 49_500,
      aiTokensLimit: 50_000,
      storageBytesConsumed: 10 * 1024 * 1024,
      storageBytesLimit: 250 * 1024 * 1024,
      notesCount: 5,
      notesLimit: 25,
      audioMinutesTranscribed: 10,
      audioMinutesLimit: 30,
    };

    // Requesting 1,000 tokens when only 500 remain
    const quotaResult = checkAITokenQuota(usage, activeTrialSubscription, 1000, baseTime);
    expect(quotaResult.allowed).toBe(false);
    expect(quotaResult.reason).toContain('Monthly AI token limit reached');
  });

  it('blocks AI token consumption immediately if the trial has expired', () => {
    const usage: UsageRecord = {
      tenantId: 'tenant-expired',
      aiTokensConsumed: 10_000,
      aiTokensLimit: 50_000,
      storageBytesConsumed: 5 * 1024 * 1024,
      storageBytesLimit: 250 * 1024 * 1024,
      notesCount: 3,
      notesLimit: 25,
      audioMinutesTranscribed: 5,
      audioMinutesLimit: 30,
    };

    const quotaResult = checkAITokenQuota(usage, expiredTrialSubscription, 500, baseTime);
    expect(quotaResult.allowed).toBe(false);
    expect(quotaResult.reason).toContain('Your 7-day free trial has expired');
  });

  it('allows high-volume token consumption on active Pro subscription up to 1M tokens', () => {
    const usage: UsageRecord = {
      tenantId: 'tenant-pro',
      aiTokensConsumed: 650_000,
      aiTokensLimit: PLAN_CONFIGS.pro.aiTokensLimit, // 1,000,000
      storageBytesConsumed: 5 * 1024 * 1024 * 1024,
      storageBytesLimit: PLAN_CONFIGS.pro.storageBytesLimit,
      notesCount: 140,
      notesLimit: -1,
      audioMinutesTranscribed: 120,
      audioMinutesLimit: 300,
    };

    const quotaResult = checkAITokenQuota(usage, activeProSubscription, 5000, baseTime);
    expect(quotaResult.allowed).toBe(true);
    expect(quotaResult.percentUsed).toBe(65);
  });

  it('configures Lifetime Pro as a ₹1,000 INR one-time purchase offer with 7-day trial', () => {
    expect(PLAN_CONFIGS.trial.priceInr).toBe(0);
    expect(PLAN_CONFIGS.trial.isOneTime).toBe(true);
    expect(PLAN_CONFIGS.pro.priceInr).toBe(1000); // ₹1,000 Rupee
    expect(PLAN_CONFIGS.pro.isOneTime).toBe(true);
    expect(PLAN_CONFIGS.pro.name).toBe('Brainnote Lifetime Pro');
  });

  it('enforces card upfront requirement in trial configuration with 7-day conversion', () => {
    expect(PLAN_CONFIGS.trial.features.some((f) => f.includes('Card required upfront'))).toBe(true);
    expect(PLAN_CONFIGS.trial.features.some((f) => f.includes('Auto-converts to ₹1,000'))).toBe(true);
    expect(PLAN_CONFIGS.trial.name).toContain('Card Required');
  });
});
