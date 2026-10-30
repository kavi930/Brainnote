'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Clock, 
  CreditCard, 
  Plus, 
  Upload, 
  Building2, 
  BarChart2,
  ShieldCheck,
  Share2,
  Globe
} from 'lucide-react';
import { TenantDataset } from '@/lib/mock-data';
import { getTrialStatus } from '@/lib/billing';
import { SourceType } from '@/types';
import { BrainnoteLogo } from './BrainnoteLogo';

interface NavbarProps {
  currentDataset: TenantDataset;
  allDatasets: Record<string, TenantDataset>;
  onSelectTenant: (tenantId: string) => void;
  onOpenNewNote: () => void;
  onOpenIngest: (initialTab?: SourceType) => void;
  onOpenBilling: () => void;
  onOpenShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDataset,
  allDatasets,
  onSelectTenant,
  onOpenNewNote,
  onOpenIngest,
  onOpenBilling,
  onOpenShare,
}) => {
  const { tenant, user, subscription, usage } = currentDataset;
  const trial = getTrialStatus(subscription);

  const percentTokensUsed = Math.min(
    100,
    Math.round((usage.aiTokensConsumed / usage.aiTokensLimit) * 100)
  );

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Brand & Multi-tenant switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <BrainnoteLogo size={38} subtitle="AI Multi-Source Note Engine" />

        {/* Multi-Tenant Live Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: '#F8FAFC',
          border: '1px solid var(--border-subtle)',
        }}>
          <Building2 size={16} color="var(--accent-purple)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Active Workspace (Isolated)
            </span>
            <select
              value={tenant.id}
              onChange={(e) => onSelectTenant(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
                paddingRight: '6px',
              }}
            >
              {Object.values(allDatasets).map((ds) => (
                <option key={ds.tenant.id} value={ds.tenant.id} style={{ background: '#FFFFFF', color: '#0F172A' }}>
                  {ds.tenant.name} ({ds.user.name} — {ds.tenant.tier.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trial Status, Usage Meter & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Trial or Tier Badge */}
        {subscription.status === 'trialing' ? (
          <div 
            onClick={onOpenBilling}
            className={`badge ${trial.isExpired ? 'badge-trial' : 'badge-trial'}`}
            style={{ 
              cursor: 'pointer',
              background: trial.isExpired ? '#FFE4E6' : '#FEF3C7',
              borderColor: trial.isExpired ? '#FECDD3' : '#FDE68A',
              color: trial.isExpired ? '#E11D48' : '#B45309',
              padding: '7px 14px',
              fontSize: '0.78rem',
            }}
          >
            <Clock size={14} className={trial.isExpired ? '' : 'pulse'} />
            <span>{trial.formattedTimeRemaining}</span>
            <span style={{ textDecoration: 'underline', fontWeight: 800, marginLeft: '4px' }}>
              {trial.isExpired ? 'Unlock for ₹1,000' : '₹1,000 Lifetime Offer'}
            </span>
          </div>
        ) : (
          <div 
            onClick={onOpenBilling}
            className="badge badge-pro" 
            style={{ cursor: 'pointer', padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <ShieldCheck size={14} />
            <span>Lifetime Pro Active</span>
          </div>
        )}

        {/* Usage Quick Pill */}
        <div 
          onClick={onOpenBilling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '9999px',
            background: '#F8FAFC',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Click to view AI Token & Storage quotas"
        >
          <BarChart2 size={14} color="var(--accent-cyan)" />
          <span style={{ color: '#64748B', fontWeight: 500 }}>AI Quota:</span>
          <span style={{ fontWeight: 700, color: percentTokensUsed > 80 ? '#E11D48' : '#0F172A' }}>
            {percentTokensUsed}%
          </span>
        </div>

        {/* Search Web Sources & Take Notes Button */}
        <button
          onClick={() => onOpenIngest('web')}
          className="btn btn-secondary"
          style={{
            fontSize: '0.82rem',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            color: '#0284C7',
            fontWeight: 700,
          }}
          title="Search web sources, enter article URLs (e.g. Machine Learning Mastery), and generate interview Q&A"
        >
          <Globe size={14} color="#0284C7" />
          <span>Web &amp; Notes</span>
        </button>

        {/* Ingest Source Button */}
        <button
          onClick={() => onOpenIngest()}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          <Upload size={14} color="var(--accent-cyan)" />
          <span>Ingest Source</span>
        </button>

        {/* Share & Invite Collaborators Button */}
        <button
          onClick={onOpenShare}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Share & Invite Collaborators to Add Notes"
        >
          <Share2 size={14} color="#6552A3" />
          <span>Share</span>
        </button>

        {/* New Note Button */}
        <button
          onClick={onOpenNewNote}
          className="btn btn-primary"
          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
        >
          <Plus size={15} />
          <span>New Note</span>
        </button>

        {/* Billing Button */}
        <button
          onClick={onOpenBilling}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 11px' }}
          title="Manage Subscription & Billing"
        >
          <CreditCard size={15} color="#475569" />
        </button>

        {/* Admin Dashboard Link */}
        <Link
          href="/admin"
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '8px 11px', textDecoration: 'none' }}
          title="Administrative Dashboard (Super Admin)"
        >
          <ShieldCheck size={15} color="var(--accent-purple)" />
        </Link>

        {/* User Account Initials Badge (NO EXTERNAL IMAGES) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
          <div
            title={`${user.name} (${user.email})`}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#EDE9FE',
              border: '2px solid #C4B5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#6D28D9',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
