// ==============================================================================
// Brainnote AI — Supabase Database Client & Connection Manager
// Architecture: Serverless-Safe via Stateless HTTPS / PostgREST (@supabase/supabase-js)
// Zero Connection Pool Exhaustion on Vercel Lambdas
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instances across serverless function warm executions
declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_ADMIN_CLIENT__: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __SUPABASE_PUBLIC_CLIENT__: SupabaseClient | undefined;
}

/**
 * Returns true if Supabase project environment variables are configured.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && (serviceKey || anonKey));
}

/**
 * Server-Side Admin Client (Bypasses RLS using the secure service_role key)
 * CRITICAL SECURITY INVARIANT:
 * This client MUST ONLY be invoked from server-side code (API routes, server actions).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser client.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!global.__SUPABASE_ADMIN_CLIENT__) {
    global.__SUPABASE_ADMIN_CLIENT__ = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return global.__SUPABASE_ADMIN_CLIENT__;
}

/**
 * Public Client (Enforces Row-Level Security via anon public key)
 * Safe for client-side and authenticated tenant session requests.
 */
export function getSupabasePublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!global.__SUPABASE_PUBLIC_CLIENT__) {
    global.__SUPABASE_PUBLIC_CLIENT__ = createClient(url, anonKey, {
      auth: {
        persistSession: true,
      },
    });
  }

  return global.__SUPABASE_PUBLIC_CLIENT__;
}
