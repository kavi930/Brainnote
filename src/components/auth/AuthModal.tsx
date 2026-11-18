'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
  RefreshCw,
  X
} from 'lucide-react';
import { getSupabasePublicClient, isDatabaseConfigured } from '@/lib/db/client';

export type AuthMode = 'login' | 'signup' | 'forgot_password' | 'reset_password' | 'verify_email';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: AuthMode;
  onAuthSuccess: (user: { id: string; email: string; name: string; tenantId: string }) => void;
  allowClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  allowClose = false,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation
    if (!email.trim() || !validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (mode === 'signup' || mode === 'login' || mode === 'reset_password') {
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    if ((mode === 'signup' || mode === 'reset_password') && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabasePublicClient();

      // Case A: Real Supabase Auth is configured
      if (isDatabaseConfigured() && supabase) {
        if (mode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }

          if (data.user) {
            const userTenantId = (data.user.user_metadata?.tenantId as string) || `tenant-${data.user.id.slice(0, 8)}`;
            const userName = (data.user.user_metadata?.name as string) || email.split('@')[0];
            onAuthSuccess({
              id: data.user.id,
              email: data.user.email || email.trim(),
              name: userName,
              tenantId: userTenantId,
            });
            if (onClose) onClose();
          }
        } else if (mode === 'signup') {
          const generatedTenantId = `tenant-${Date.now().toString(36)}`;
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name.trim(),
                tenantId: generatedTenantId,
              },
            },
          });

          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }

          if (data.user) {
            // Check if confirmation is required
            if (data.session) {
              onAuthSuccess({
                id: data.user.id,
                email: data.user.email || email.trim(),
                name: name.trim(),
                tenantId: generatedTenantId,
              });
              if (onClose) onClose();
            } else {
              setMode('verify_email');
              setSuccessMessage('Account created! Please check your email to verify your account before logging in.');
            }
          }
        } else if (mode === 'forgot_password') {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/?mode=reset_password`,
          });

          if (error) {
            setErrorMessage(error.message);
          } else {
            setSuccessMessage('Password reset instructions have been dispatched to your email.');
          }
        } else if (mode === 'reset_password') {
          const { error } = await supabase.auth.updateUser({
            password,
          });

          if (error) {
            setErrorMessage(error.message);
          } else {
            setSuccessMessage('Password successfully updated! You can now log in with your new credentials.');
            setTimeout(() => setMode('login'), 2000);
          }
        }
      } else {
        // Case B: In-Memory / Local Development Mode (Offline Resilience)
        await new Promise((r) => setTimeout(r, 600));

        if (mode === 'forgot_password') {
          setSuccessMessage('Password reset email simulated for local development. You can log in directly.');
          setTimeout(() => setMode('login'), 2000);
        } else if (mode === 'signup') {
          const mockId = `usr-${Date.now().toString(36)}`;
          const mockTenantId = `tenant-${Date.now().toString(36)}`;
          onAuthSuccess({
            id: mockId,
            email: email.trim(),
            name: name.trim(),
            tenantId: mockTenantId,
          });
          if (onClose) onClose();
        } else if (mode === 'login') {
          const mockId = email.includes('alex') ? '00000000-0000-0000-0000-000000000002' : `usr-${email.slice(0, 5)}`;
          const mockTenantId = email.includes('alex') ? 'tenant-acme' : `tenant-${email.slice(0, 5)}`;
          onAuthSuccess({
            id: mockId,
            email: email.trim(),
            name: email.includes('alex') ? 'Alex Rivera' : email.split('@')[0],
            tenantId: mockTenantId,
          });
          if (onClose) onClose();
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden select-none">
        {/* Close Button if permissible */}
        {allowClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md mb-3">
            B
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {mode === 'login' && 'Sign In to Brainnote'}
            {mode === 'signup' && 'Create Your Research Workspace'}
            {mode === 'forgot_password' && 'Reset Your Password'}
            {mode === 'reset_password' && 'Set New Password'}
            {mode === 'verify_email' && 'Verify Your Email'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            {mode === 'login' && 'Access your notebooks, grounded research sessions, and learning artifacts.'}
            {mode === 'signup' && 'Join thousands of researchers and engineers learning faster with verified AI.'}
            {mode === 'forgot_password' && 'Enter your registered email address to receive recovery instructions.'}
            {mode === 'reset_password' && 'Choose a secure new password for your account.'}
            {mode === 'verify_email' && 'Verification email has been dispatched.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
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

        {/* Verify Email Notice Screen */}
        {mode === 'verify_email' ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We have dispatched a verification link to <strong>{email}</strong>. Please click the link to confirm your account, then log in below.
            </p>
            <button
              onClick={() => setMode('login')}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {/* Name (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            {mode !== 'reset_password' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    {mode === 'reset_password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setMode('forgot_password');
                      }}
                      className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Signup and Reset Password) */}
            {(mode === 'signup' || mode === 'reset_password') && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot_password' && 'Send Reset Instructions'}
                    {mode === 'reset_password' && 'Save New Password'}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Switcher */}
        {mode !== 'verify_email' && (
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('signup');
                  }}
                  className="font-bold text-[var(--accent-primary)] hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="font-bold text-[var(--accent-primary)] hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}

        {/* Security & RLS Footnote */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Secured via Supabase Auth & Tenant Row-Level Security</span>
        </div>
      </div>
    </div>
  );
};

