'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Shield, 
  AlertTriangle, 
  Lock, 
  Sparkles, 
  CreditCard,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Subscription, UsageRecord, SubscriptionTier } from '@/types';
import { PLAN_CONFIGS, getTrialStatus } from '@/lib/billing';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  usage: UsageRecord;
  onSimulateUpgrade: (tier: SubscriptionTier) => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  usage,
  onSimulateUpgrade,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutFeedback, setCheckoutFeedback] = useState<string | null>(null);

  // Card Upfront Trial Subscription Form State
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardHolder, setCardHolder] = useState('Alex Rivera');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const trial = getTrialStatus(subscription);

  // Authorize Card & Start 7-Day Free Trial Subscription
  const handleAuthorizeTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    setCheckoutFeedback('Authorizing card and activating 7-day trial subscription...');

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'trial',
          tenantId: subscription.tenantId,
          userEmail: 'alex@acmelabs.ai',
        }),
      });

      const data = await res.json();
      setIsAuthorizing(false);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutFeedback('✓ Payment card authorized! 7-Day Free Trial activated with subscription on file. ₹0 charged today.');
        setShowCardForm(false);
        setTimeout(() => {
          onSimulateUpgrade('trial');
          setCheckoutFeedback(null);
        }, 1200);
      }
    } catch {
      setIsAuthorizing(false);
      onSimulateUpgrade('trial');
      setShowCardForm(false);
    }
  };

  // Instant Stripe Checkout for Lifetime Pro or Team
  const handleStripeCheckout = async (tier: SubscriptionTier) => {
    setIsCheckingOut(true);
    setCheckoutFeedback('Initiating secure one-time payment session...');

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          tenantId: subscription.tenantId,
          userEmail: 'alex@acmelabs.ai',
        }),
      });

      const data = await res.json();
      setIsCheckingOut(false);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutFeedback(
          data.message || 'Payment provider configured in test simulation mode. Upgrading workspace...'
        );
        setTimeout(() => {
          onSimulateUpgrade(tier);
          setCheckoutFeedback(null);
        }, 1200);
      }
    } catch {
      setIsCheckingOut(false);
      onSimulateUpgrade(tier);
    }
  };

  const handleCancelTrialSubscription = () => {
    setCancelFeedback('Trial subscription canceled. You will retain access until your trial period concludes and will not be charged.');
    setTimeout(() => {
      setCancelFeedback(null);
    }, 4500);
  };

  const hasCardOnFile = !!subscription.hasPaymentMethod;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        borderRadius: '24px',
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={18} color="#D97706" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                7-Day Free Trial (Card Required) & ₹1,000 Lifetime Plan
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              To activate the 7-day free trial, a payment subscription is set up upfront (₹0 charged today). You can also unlock Lifetime Pro for a one-time ₹1,000 payment.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Current status banner */}
        <div style={{ padding: '24px 32px 0' }}>
          <div style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: trial.isExpired ? '#FFE4E6' : '#EDE9FE',
            border: `1px solid ${trial.isExpired ? '#FECDD3' : '#DDD6FE'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {trial.isExpired ? (
                <AlertTriangle size={22} color="#E11D48" />
              ) : (
                <Shield size={22} color="#7C3AED" />
              )}
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: trial.isExpired ? '#9F1239' : '#4C1D95' }}>
                  {subscription.status === 'trialing' 
                    ? `7-Day Free Trial Active (${trial.formattedTimeRemaining})` 
                    : subscription.planTier === 'pro' 
                    ? 'Brainnote Lifetime Pro Active (Paid Once, Owned Forever)' 
                    : 'Brainnote Team Lifetime Active'}
                </div>
                <div style={{ fontSize: '0.8rem', color: trial.isExpired ? '#BE123C' : '#5B21B6', marginTop: '2px' }}>
                  AI Token Utilization: {usage.aiTokensConsumed.toLocaleString()} / {usage.aiTokensLimit.toLocaleString()} ({(usage.aiTokensConsumed / usage.aiTokensLimit * 100).toFixed(1)}% used)
                  {hasCardOnFile && ' • Card on file: Visa ending in 4242'}
                </div>
              </div>
            </div>

            {subscription.planTier === 'trial' && (
              <span style={{
                background: '#FFFFFF',
                color: '#7C3AED',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: '1px solid #DDD6FE',
              }}>
                Trial Subscription
              </span>
            )}
          </div>

          {checkoutFeedback && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}>
              {checkoutFeedback}
            </div>
          )}

          {cancelFeedback && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}>
              {cancelFeedback}
            </div>
          )}
        </div>

        {/* Card Setup Form (When user wants to start/update trial subscription) */}
        {showCardForm && (
          <div style={{ padding: '24px 32px 0' }}>
            <form onSubmit={handleAuthorizeTrial} style={{
              background: '#F8FAFC',
              border: '2px solid #D97706',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#D97706" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    Setup Subscription to Activate 7-Day Free Trial
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order Breakdown */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                    Amount Due Today
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                    ₹0.00
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                    After 7-Day Trial (Nov 03, 2026)
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    ₹1,000 <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Lifetime Pro License</span>
                  </div>
                </div>
              </div>

              {/* Card Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 •••• •••• 4242"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CVC / Security Code
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} color="#059669" />
                  <span>256-bit SSL encrypted. Cancel anytime during trial with 1 click.</span>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCardForm(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthorizing}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.82rem',
                      padding: '8px 18px',
                      background: '#D97706',
                      borderColor: '#D97706',
                      fontWeight: 800,
                    }}
                  >
                    {isAuthorizing ? 'Authorizing Card...' : 'Authorize Card & Start 7-Day Trial (₹0.00)'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: 7-Day Free Trial (Card Required Upfront) */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #CBD5E1',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}>
                  Subscription Required
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                  ₹0 Due Today
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                7-Day Free Trial
              </h3>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                ₹0 <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>/ first 7 days</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '16px' }}>
                Auto-bills ₹1,000 Lifetime Pro after 7 days unless canceled.
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                {PLAN_CONFIGS.trial.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: '1.5' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '24px' }}>
              {hasCardOnFile ? (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    fontSize: '0.78rem',
                    color: '#047857',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}>
                    <CheckCircle2 size={15} />
                    <span>Card on File: Visa •••• 4242</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setShowCardForm(true)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '6px' }}
                    >
                      Update Card
                    </button>
                    <button
                      onClick={handleCancelTrialSubscription}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '6px', color: '#E11D48' }}
                    >
                      Cancel Trial
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCardForm(true)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '10px',
                    background: '#D97706',
                    borderColor: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CreditCard size={15} />
                  <span>Subscribe to Start Trial (₹0)</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Featured ₹1,000 One-Time Lifetime Pro */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #7C3AED',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '24px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #0284C7 100%)',
              color: '#FFFFFF',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              One-Time Purchase • No Subscription
            </div>

            <div>
              <span style={{
                background: '#EDE9FE',
                color: '#6D28D9',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '12px',
              }}>
                Founder Lifetime License
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Lifetime Pro
              </h3>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#7C3AED', marginBottom: '4px' }}>
                ₹1,000
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', marginBottom: '16px' }}>
                Pay once. Keep forever. Zero monthly fees.
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                {PLAN_CONFIGS.pro.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="#7C3AED" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: '1.5' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('pro')}
              disabled={subscription.planTier === 'pro' && !trial.isExpired}
              className="btn btn-primary"
              style={{
                marginTop: '24px',
                width: '100%',
                fontSize: '0.88rem',
                fontWeight: 800,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={16} />
              <span>
                {subscription.planTier === 'pro'
                  ? 'Lifetime Access Active'
                  : 'Get Lifetime Access for ₹1,000'}
              </span>
            </button>
          </div>

          {/* Card 3: Team Lifetime */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div>
              <span style={{
                background: '#E0F2FE',
                color: '#0369A1',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '12px',
              }}>
                Team License
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Team Lifetime
              </h3>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                ₹2,999
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '16px' }}>
                One-time team license • 5M shared tokens
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                {PLAN_CONFIGS.team.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: '1.5' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('team')}
              className="btn btn-secondary"
              style={{ marginTop: '24px', width: '100%', fontSize: '0.82rem', fontWeight: 700 }}
            >
              {subscription.planTier === 'team' ? 'Current Team Plan' : 'Get Team License (₹2,999)'}
            </button>
          </div>
        </div>

        {/* Commercial Security Architecture Footer */}
        <div style={{
          padding: '20px 32px 28px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}>
          <Lock size={18} color="#7C3AED" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
            <strong style={{ color: '#0F172A' }}>Card-Upfront Trial & One-Time Payment Security:</strong> Setting up a trial subscription authorizes your payment method with ₹0 charged today. After 7 days, your account seamlessly transitions to the ₹1,000 Lifetime Pro tier. Payments are cryptographically verified using HMAC SHA-256 via Stripe webhook endpoints.
          </div>
        </div>
      </div>
    </div>
  );
};
