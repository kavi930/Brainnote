// ==============================================================================
// Brainnote SaaS — Billing, Entitlement & 7-Day Trial Enforcement
// ==============================================================================

import { Subscription, SubscriptionTier, UsageRecord } from '@/types';

export interface PlanConfig {
  name: string;
  tier: SubscriptionTier;
  priceInr: number;
  priceMonthlyUsd: number;
  isOneTime: boolean;
  aiTokensLimit: number;
  notesLimit: number;
  storageBytesLimit: number; // In bytes
  audioMinutesLimit: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionTier, PlanConfig> = {
  trial: {
    name: '7-Day Free Trial (Card Required)',
    tier: 'trial',
    priceInr: 0,
    priceMonthlyUsd: 0,
    isOneTime: true,
    aiTokensLimit: 50_000,
    notesLimit: 25,
    storageBytesLimit: 250 * 1024 * 1024, // 250 MB
    audioMinutesLimit: 30,
    features: [
      '7 days of full access to all AI features',
      'Card required upfront (₹0 due today)',
      'Up to 25 notes across YouTube, Audio, PDFs & Web',
      '50,000 AI tokens included',
      'Auto-converts to ₹1,000 Lifetime Pro after 7 days unless canceled',
      'Cancel anytime before trial ends with 1 click',
      'Strict tenant data isolation',
    ],
  },
  pro: {
    name: 'Brainnote Lifetime Pro',
    tier: 'pro',
    priceInr: 1000, // ₹1,000 One-Time Purchase
    priceMonthlyUsd: 12,
    isOneTime: true,
    aiTokensLimit: 1_000_000,
    notesLimit: -1, // Unlimited
    storageBytesLimit: 25 * 1024 * 1024 * 1024, // 25 GB
    audioMinutesLimit: 300,
    features: [
      '₹1,000 One-Time Payment (Lifetime access, no monthly subscriptions!)',
      '1,000,000 AI tokens included',
      'Unlimited notes & nested knowledge folders',
      'YouTube transcripts & meeting audio diarization',
      'Interactive Quizzes & Active-Recall Flashcards',
      'Cross-source Grounded Q&A with verifiable citations',
      'Chrome/Edge extension side panel & desktop capture',
    ],
  },
  team: {
    name: 'Brainnote Team Lifetime',
    tier: 'team',
    priceInr: 2999, // ₹2,999 One-Time
    priceMonthlyUsd: 36,
    isOneTime: true,
    aiTokensLimit: 5_000_000,
    notesLimit: -1, // Unlimited
    storageBytesLimit: 100 * 1024 * 1024 * 1024, // 100 GB
    audioMinutesLimit: 1_200,
    features: [
      '₹2,999 One-Time Payment for entire team',
      '5,000,000 AI tokens shared across team members',
      'Collaborative shared folders and team library',
      'Centralized Admin Dashboard & Usage Controls',
      'Audit logging & granular role permissions',
      'Priority support',
    ],
  },
};

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  formattedTimeRemaining: string;
}

/**
 * Accurately calculates trial timeline and expiration status based on UTC timestamps.
 */
export function getTrialStatus(subscription: Subscription, currentTime: Date = new Date()): TrialStatus {
  const trialEnd = new Date(subscription.trialEnd);
  const now = currentTime.getTime();
  const diffMs = trialEnd.getTime() - now;

  if (subscription.status !== 'trialing') {
    return {
      isActive: false,
      isExpired: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      formattedTimeRemaining: 'Subscribed',
    };
  }

  if (diffMs <= 0) {
    return {
      isActive: false,
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      formattedTimeRemaining: 'Trial Expired',
    };
  }

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let formattedTimeRemaining = `${daysRemaining} days left`;
  if (daysRemaining === 0) {
    formattedTimeRemaining = `${hoursRemaining} hours left`;
  }

  return {
    isActive: true,
    isExpired: false,
    daysRemaining,
    hoursRemaining,
    formattedTimeRemaining,
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  percentUsed: number;
}

/**
 * Pre-flight check to verify whether a tenant has enough AI token quota
 * to run a requested generation before invoking costly LLM APIs.
 */
export function checkAITokenQuota(
  usage: UsageRecord,
  subscription: Subscription,
  requestedTokens: number = 1000,
  now: Date = new Date()
): QuotaCheckResult {
  const trial = getTrialStatus(subscription, now);

  if (subscription.status === 'trialing' && trial.isExpired) {
    return {
      allowed: false,
      reason: 'Your 7-day free trial has expired. Please upgrade to Pro to continue generating AI insights.',
      currentUsage: usage.aiTokensConsumed,
      limit: usage.aiTokensLimit,
      percentUsed: 100,
    };
  }

  if (subscription.status === 'past_due' || subscription.status === 'canceled') {
    return {
      allowed: false,
      reason: 'Your subscription is inactive. Please update your payment method to resume AI processing.',
      currentUsage: usage.aiTokensConsumed,
      limit: usage.aiTokensLimit,
      percentUsed: 100,
    };
  }

  const projectedUsage = usage.aiTokensConsumed + requestedTokens;
  const percentUsed = Math.min(100, Math.round((usage.aiTokensConsumed / usage.aiTokensLimit) * 100));

  if (projectedUsage > usage.aiTokensLimit) {
    return {
      allowed: false,
      reason: `Monthly AI token limit reached (${usage.aiTokensConsumed.toLocaleString()} / ${usage.aiTokensLimit.toLocaleString()} tokens). Upgrade your plan or wait for the next billing cycle.`,
      currentUsage: usage.aiTokensConsumed,
      limit: usage.aiTokensLimit,
      percentUsed: 100,
    };
  }

  return {
    allowed: true,
    currentUsage: usage.aiTokensConsumed,
    limit: usage.aiTokensLimit,
    percentUsed,
  };
}
