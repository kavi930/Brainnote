'use client';

import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  LogOut, 
  X, 
  Check, 
  Building2, 
  Crown,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getSupabasePublicClient, isDatabaseConfigured } from '@/lib/db/client';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  tenant: {
    id: string;
    name: string;
    tier: string;
  };
  onUpdateUser: (updated: { name: string; email: string }) => void;
  onLogout: () => void;
  onOpenBilling: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  tenant,
  onUpdateUser,
  onLogout,
  onOpenBilling,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'workspace'>('profile');

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const supabase = getSupabasePublicClient();
      if (isDatabaseConfigured() && supabase) {
        const { error } = await supabase.auth.updateUser({
          data: { name },
        });
        if (error) {
          setErrorMessage(error.message);
          setIsSaving(false);
          return;
        }
      }

      onUpdateUser({ name, email });
      setSuccessMessage('Profile information saved successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabasePublicClient();
      if (isDatabaseConfigured() && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          setErrorMessage(error.message);
          setIsSaving(false);
          return;
        }
      }

      setSuccessMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 select-none relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold text-sm flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">{user.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[var(--border-subtle)] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'security'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            Password & Security
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'workspace'
                ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            Workspace & Plan
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] opacity-60 text-[var(--text-primary)] cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Managed via Supabase Auth identity provider.
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                New Password
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-[var(--border-subtle)] space-y-1">
              <span className="font-bold text-[11px] text-[var(--text-primary)] flex items-center gap-1">
                <Shield size={12} className="text-emerald-500" />
                Password Recommendations
              </span>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Use at least 8 characters, mixing uppercase letters, numbers, and symbols to ensure resilient protection of your research notebooks.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="submit"
                disabled={isSaving || !newPassword}
                className="px-4 py-2 rounded-xl font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all shadow-sm"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Workspace */}
        {activeTab === 'workspace' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[var(--accent-primary)]" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">{tenant.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center gap-1">
                  <Crown size={11} />
                  {tenant.tier}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tenant Isolation Scope: <code className="text-[10px]">{tenant.id}</code>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBilling();
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm text-center"
              >
                Manage Subscription & Quotas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

