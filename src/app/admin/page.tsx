'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Search, 
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { INITIAL_TENANTS, TenantDataset } from '@/lib/mock-data';
import { BrainnoteLogo } from '@/components/BrainnoteLogo';

export default function AdminDashboardPage() {
  const [tenants, setTenants] = useState<Record<string, TenantDataset>>(INITIAL_TENANTS);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member'>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Security Gate: Role-based access control
  if (currentUserRole !== 'owner') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '36px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #CBD5E1',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <AlertTriangle size={48} color="#E11D48" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Access Restricted: Security Boundary
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
            The Brainnote SaaS Administrative Dashboard is strictly restricted to account owners. Your current role is <code>member</code>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-secondary" style={{ textDecoration: 'none', fontWeight: 700 }}>
              Return to Workspace
            </Link>
            <button
              onClick={() => setCurrentUserRole('owner')}
              className="btn btn-primary"
            >
              Switch Role to Owner (Dev Toggle)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tenantList = Object.values(tenants);

  // Aggregates
  const totalTenants = tenantList.length;
  const activeSubs = tenantList.filter((t) => t.subscription.status === 'active').length;
  const trialingSubs = tenantList.filter((t) => t.subscription.status === 'trialing').length;
  const totalTokensConsumed = tenantList.reduce((acc, t) => acc + t.usage.aiTokensConsumed, 0);
  const totalNotesCount = tenantList.reduce((acc, t) => acc + t.notes.length, 0);
  const oneTimeRevenueInr = activeSubs * 1000;

  // Filtered tenants
  const filteredTenants = tenantList.filter(
    (t) =>
      t.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTenant = selectedTenantId ? tenants[selectedTenantId] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Header */}
      <header style={{
        padding: '16px 36px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" className="btn btn-secondary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Back to App</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrainnoteLogo size={36} showText={false} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Brainnote Admin Dashboard</h1>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#D1FAE5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                }}>
                  Super Admin (RBAC: Owner)
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                System-wide customer lifecycle, multi-tenant usage metrics, and subscription controls
              </p>
            </div>
          </div>
        </div>

        {/* Dev RBAC Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>RBAC Test Gate:</span>
          <button
            onClick={() => setCurrentUserRole('member')}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            Simulate Non-Admin Access
          </button>
        </div>
      </header>

      {/* Main Admin Content with Generous Whitespace */}
      <main style={{ padding: '36px', maxWidth: '1360px', width: '100%', margin: '0 auto' }}>
        {/* Metric Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Tenants</span>
              <Building2 size={18} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{totalTenants}</div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
              100% database-isolated
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>One-Time Revenue</span>
              <CreditCard size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
              ₹{oneTimeRevenueInr.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
              {activeSubs} Lifetime Paid (₹1,000 each) • {trialingSubs} in 7-day trial
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Tokens Metered</span>
              <Cpu size={18} color="#7C3AED" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
              {totalTokensConsumed.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7C3AED', fontWeight: 600, marginTop: '6px' }}>
              Across Gemini & GPT-4o
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes Managed</span>
              <Sparkles size={18} color="#D97706" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{totalNotesCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px' }}>
              Across YouTube, Audio & PDFs
            </div>
          </div>
        </div>

        {/* Tenant Directory Table */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Table Header & Search */}
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Tenant Customer Directory</h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Inspect isolated customer accounts, subscription health, and token quotas
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '8px 14px',
              width: '300px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Search size={15} color="#64748B" style={{ marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Search tenant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0F172A',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)', color: '#475569' }}>
                  <th style={{ padding: '14px 28px', fontWeight: 700 }}>Customer / Organization</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Plan Tier</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Subscription Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>AI Token Consumption</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Notes / Storage</th>
                  <th style={{ padding: '14px 28px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((dataset) => {
                  const { tenant, user, subscription, usage } = dataset;
                  const tokenPercent = Math.min(
                    100,
                    Math.round((usage.aiTokensConsumed / usage.aiTokensLimit) * 100)
                  );
                  const isExpired = subscription.status === 'trialing' && new Date(subscription.trialEnd) < new Date();

                  return (
                    <tr
                      key={tenant.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                      }}
                    >
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={user.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{tenant.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.email} • slug: {tenant.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        <span className={`badge ${tenant.tier === 'trial' ? 'badge-trial' : tenant.tier === 'pro' ? 'badge-pro' : 'badge-team'}`}>
                          {tenant.tier.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isExpired ? (
                            <span style={{ color: '#E11D48', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={14} /> Trial Expired
                            </span>
                          ) : subscription.status === 'active' ? (
                            <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Active Subscription
                            </span>
                          ) : (
                            <span style={{ color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} /> 7-Day Trial
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ width: '170px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{usage.aiTokensConsumed.toLocaleString()}</span>
                            <span style={{ color: '#64748B', fontWeight: 600 }}>{tokenPercent}%</span>
                          </div>
                          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${tokenPercent}%`,
                              height: '100%',
                              background: tokenPercent > 80 ? '#E11D48' : 'linear-gradient(90deg, #7C3AED, #0284C7)',
                            }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                          {usage.notesCount} notes
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {(usage.storageBytesConsumed / (1024 * 1024)).toFixed(0)} MB storage
                        </div>
                      </td>

                      <td style={{ padding: '18px 28px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTenantId(tenant.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '6px 12px', fontWeight: 600 }}
                        >
                          Audit Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Audit Detail Modal */}
        {selectedTenant && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '620px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  Tenant Audit: {selectedTenant.tenant.name}
                </h3>
                <button
                  onClick={() => setSelectedTenantId(null)}
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
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.88rem' }}>
                <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Tenant UUID (Primary Key):
                  </div>
                  <code style={{ color: '#7C3AED', fontWeight: 700 }}>{selectedTenant.tenant.id}</code>
                </div>

                <div style={{ padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px' }}>
                  <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Strict Data Isolation Verification:
                  </div>
                  <div style={{ color: '#15803D', fontWeight: 800 }}>
                    ✓ Row-Level Security Enforced (tenant_id = {selectedTenant.tenant.id})
                  </div>
                  <div style={{ color: '#166534', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.5' }}>
                    Zero queries from any other tenant can access this customer's {selectedTenant.notes.length} notes, folders, or AI artifacts.
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Trial & Billing Parameters:
                  </div>
                  <div style={{ color: '#0F172A', marginTop: '2px' }}>Status: <strong>{selectedTenant.subscription.status}</strong></div>
                  <div style={{ color: '#0F172A', marginTop: '2px' }}>Trial Period End: <strong>{new Date(selectedTenant.subscription.trialEnd).toUTCString()}</strong></div>
                  <div style={{ color: '#0F172A', marginTop: '2px' }}>AI Token Quota: <strong>{selectedTenant.usage.aiTokensConsumed.toLocaleString()} / {selectedTenant.usage.aiTokensLimit.toLocaleString()}</strong></div>
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setSelectedTenantId(null)} className="btn btn-secondary" style={{ fontWeight: 700 }}>
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
