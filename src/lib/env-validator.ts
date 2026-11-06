// ==============================================================================
// Brainnote AI — Environment Variable Validator
// Validates Production Secrets without Leaking Values or Crashing Offline Testing
// ==============================================================================

export interface EnvValidationReport {
  isDatabaseConfigured: boolean;
  hasServiceRoleKey: boolean;
  hasAnonKey: boolean;
  hasSupabaseUrl: boolean;
  environment: 'development' | 'production' | 'test';
  warnings: string[];
}

export function validateEnvironment(): EnvValidationReport {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const env = (process.env.NEXT_PUBLIC_APP_ENV as 'development' | 'production' | 'test') || 'development';

  const warnings: string[] = [];

  const hasSupabaseUrl = Boolean(url && url.startsWith('https://') && url.includes('.supabase.co'));
  const hasAnonKey = Boolean(anonKey && anonKey.length > 20);
  const hasServiceRoleKey = Boolean(serviceKey && serviceKey.length > 20);

  if (!hasSupabaseUrl) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL is not set or does not match https://*.supabase.co. In-memory store fallback active.');
  }

  if (!hasServiceRoleKey && !hasAnonKey) {
    warnings.push('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set. Local in-memory store adapter active.');
  }

  // Critical Security Check: Ensure service_role key is never prefixed with NEXT_PUBLIC_
  const exposedServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (exposedServiceKey) {
    warnings.push('SECURITY CRITICAL: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY detected! Remove NEXT_PUBLIC_ prefix immediately to prevent client-side secret exposure.');
  }

  return {
    isDatabaseConfigured: hasSupabaseUrl && (hasServiceRoleKey || hasAnonKey),
    hasServiceRoleKey,
    hasAnonKey,
    hasSupabaseUrl,
    environment: env,
    warnings,
  };
}
