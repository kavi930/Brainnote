'use client';

import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Trash2,
  BookmarkCheck,
  Calendar,
  Layers,
  HardDrive,
  Sparkles,
  CheckCircle2,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Notebook, RetentionPeriodDays, UsageRecord } from '@/types';

interface StorageRetentionViewProps {
  notebooks: Notebook[];
  usage: UsageRecord;
  currentRetentionPolicy: RetentionPeriodDays;
  onChangePolicy: (days: RetentionPeriodDays) => void;
  onTogglePermanent: (sessionId: string) => void;
  onExtendRetention: (sessionId: string) => void;
  onMoveToTrash: (sessionId: string) => void;
  onRestoreFromTrash: (sessionId: string) => void;
  onPurgeTrash: () => void;
  onShowToast: (msg: string) => void;
  activeTenantId: string;
}

export const StorageRetentionView: React.FC<StorageRetentionViewProps> = ({
  notebooks,
  usage,
  currentRetentionPolicy,
  onChangePolicy,
  onTogglePermanent,
  onExtendRetention,
  onMoveToTrash,
  onRestoreFromTrash,
  onPurgeTrash,
  onShowToast,
  activeTenantId,
}) => {
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'temporary' | 'trash'>('policy');

  const now = Date.now();

  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    try {
      const res = await fetch('/api/retention/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: activeTenantId }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message || 'Retention engine completed cleanup.');
      } else {
        onShowToast(data.error || 'Cleanup execution failed.');
      }
    } catch {
      onShowToast('Error connecting to retention cleanup engine.');
    } finally {
      setIsRunningCleanup(false);
    }
  };

  // Classify sessions
  const temporarySessions = notebooks.filter(
    (nb) => !(nb as any).isPermanent && !(nb as any).isSaved && (nb as any).status !== 'trashed'
  );

  const trashedSessions = notebooks.filter((nb) => (nb as any).status === 'trashed');

  const permanentSessions = notebooks.filter(
    (nb) => (nb as any).isPermanent || (nb as any).isSaved
  );

  const storageMB = (usage.storageBytesConsumed / (1024 * 1024)).toFixed(1);
  const storageLimitMB = (usage.storageBytesLimit / (1024 * 1024)).toFixed(0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[var(--accent-primary)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              Storage & Data Retention Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Active Protection
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Automatic lifecycle policy: temporary searches expire in {currentRetentionPolicy === -1 ? 'Indefinite' : `${currentRetentionPolicy} days`}, while saved research is preserved permanently.
          </p>
        </div>

        <button
          onClick={handleRunCleanup}
          disabled={isRunningCleanup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={isRunningCleanup ? 'animate-spin' : ''} />
          <span>{isRunningCleanup ? 'Executing...' : 'Run Scheduled Cleanup'}</span>
        </button>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="p-4 sm:p-6 pb-2 max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <HardDrive size={13} className="text-sky-500" />
            Tenant Storage
          </span>
          <div className="text-lg font-bold text-[var(--text-primary)]">
            {storageMB} MB <span className="text-xs font-normal text-[var(--text-muted)]">/ {storageLimitMB} MB</span>
          </div>
          <div className="w-full bg-[var(--border-subtle)] h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (usage.storageBytesConsumed / usage.storageBytesLimit) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" />
            Permanently Preserved
          </span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {permanentSessions.length} Research Sessions
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">Will never automatically expire or delete</p>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Clock size={13} className="text-amber-500" />
            Temporary Research
          </span>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {temporarySessions.length} Sessions ({trashedSessions.length} in Trash)
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">30-day recovery buffer enabled</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="px-4 sm:px-6 max-w-5xl mx-auto w-full pt-2 shrink-0">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'policy'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            Retention Policy Settings
          </button>
          <button
            onClick={() => setActiveTab('temporary')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'temporary'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <span>Temporary Sessions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--border-subtle)]">
              {temporarySessions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'trash'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <span>Trash Recovery Bin</span>
            {trashedSessions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {trashedSessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* TAB 1: Policy Settings */}
        {activeTab === 'policy' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Default Temporary Research Expiry Period
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                When you perform ad-hoc searches or generate transient research, Brainnote assigns this expiration schedule. You can always click <strong>&ldquo;Save Permanently&rdquo;</strong> on any session to preserve it indefinitely.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
                {[
                  { days: 7 as RetentionPeriodDays, label: '7 Days', desc: 'Fast temporary scratchpad' },
                  { days: 30 as RetentionPeriodDays, label: '30 Days (Default)', desc: 'Standard research lifecycle' },
                  { days: 60 as RetentionPeriodDays, label: '60 Days', desc: 'Extended academic sprint' },
                  { days: 90 as RetentionPeriodDays, label: '90 Days', desc: 'Quarterly review cycle' },
                  { days: -1 as RetentionPeriodDays, label: 'Keep Indefinitely', desc: 'Never auto-expire sessions' },
                ].map((opt) => {
                  const isSelected = currentRetentionPolicy === opt.days;
                  return (
                    <div
                      key={opt.days}
                      onClick={() => onChangePolicy(opt.days)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/40 shadow-xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-medium)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{opt.label}</span>
                        {isSelected && <Check size={14} className="text-[var(--accent-primary)] font-bold" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-snug">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={15} />
                Strict Data Protection Invariants
              </h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc pl-5 leading-relaxed">
                <li>
                  <strong>Permanent Data Safety:</strong> Documents and notebooks explicitly saved or pinned by users remain available until manually deleted.
                </li>
                <li>
                  <strong>Original File Preservation:</strong> Uploaded PDFs, PPTX slides, and audio recordings associated with saved research are never auto-deleted.
                </li>
                <li>
                  <strong>Trash Recovery Buffer:</strong> Expired sessions remain recoverable in the Trash for 30 days before permanent deletion.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: Temporary Sessions */}
        {activeTab === 'temporary' && (
          <div className="space-y-3">
            {temporarySessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                No active temporary sessions. All your current research is permanently saved.
              </div>
            ) : (
              temporarySessions.map((session) => {
                const expiresAt = (session as any).expiresAt
                  ? new Date((session as any).expiresAt).getTime()
                  : now + 30 * 86400000;
                const daysRemaining = Math.max(1, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-wrap items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {session.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            daysRemaining <= 5
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          Expires in {daysRemaining} days
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Created {new Date(session.createdAt).toLocaleDateString()} &bull; {session.sources?.length || 0} sources &bull; {session.artifacts?.length || 0} documents
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onTogglePermanent(session.id);
                          onShowToast(`Permanently saved "${session.title}"`);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <BookmarkCheck size={13} />
                        <span>Save Permanently</span>
                      </button>

                      <button
                        onClick={() => {
                          onExtendRetention(session.id);
                          onShowToast(`Extended retention for "${session.title}" (+30 days)`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
                        title="Extend 30 Days"
                      >
                        +30 Days
                      </button>

                      <button
                        onClick={() => onMoveToTrash(session.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50"
                        title="Move to Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: Trash Recovery Bin */}
        {activeTab === 'trash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                Items in Trash remain recoverable for 30 days before permanent deletion.
              </span>
              {trashedSessions.length > 0 && (
                <button
                  onClick={onPurgeTrash}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Empty Trash ({trashedSessions.length})
                </button>
              )}
            </div>

            {trashedSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                Trash is empty.
              </div>
            ) : (
              trashedSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)] line-through opacity-70">
                      {session.title}
                    </h4>
                    <span className="text-[10px] text-rose-500 font-medium">Pending 30-day purge</span>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreFromTrash(session.id);
                      onShowToast(`Restored "${session.title}"`);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-white"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

