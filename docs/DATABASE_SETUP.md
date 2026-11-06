# Brainnote AI — Supabase PostgreSQL Production Setup Guide

This guide details how to configure Brainnote AI to use your Supabase PostgreSQL project in local development and production (Vercel).

---

## 1. Schema Verification

The production database schema (`003_supabase_production_schema.sql`) has been executed in your Supabase SQL Editor.

It established:
- **11 Normalized Tables**: `tenants`, `users`, `subscriptions`, `usage_records`, `notebooks`, `notes`, `note_sources`, `notebook_sources`, `notebook_conversations`, `ai_artifacts`, and `collaborators`.
- **Row Level Security (RLS)**: Enabled across all 11 tables with strict tenant-isolation policies.
- **Indexes**: Query performance indexes on `tenant_id`, `user_id`, `created_at`, `status`, and `note_id`.
- **Seed Workspace**: Default `Acme Corp AI Lab` workspace for immediate availability.

---

## 2. Obtain Your Supabase Credentials

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your Brainnote project.
3. Click the gear icon (**Project Settings**) in the left sidebar.
4. Select **API** (under Configuration).
5. Copy the following three values:
   - **Project URL**: Found under *Project URL* (e.g., `https://xyzcompany.supabase.co`).
   - **Project API Keys — `anon` `public`**: Click "Reveal" or copy directly (safe for browser client-side).
   - **Project API Keys — `service_role` `secret`**: Click "Reveal" and copy (strictly server-side only).

> **SECURITY REMINDER**:
> Never commit `SUPABASE_SERVICE_ROLE_KEY` to GitHub or share it in chat. It has admin permissions that bypass RLS and should only be stored in private server environment variables.

---

## 3. Local Development Configuration

In the root directory of your project (`c:\Users\HP\.gemini\antigravity-ide\scratch\brainnote` or your repository root), create or update `.env.local`:

```env
# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Existing App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

When these variables are present, Brainnote automatically:
- Connects to Supabase over stateless HTTPS PostgREST (no connection exhaustion on serverless).
- Persists all notes, sources, notebooks, AI artifacts, and collaborators to PostgreSQL.
- Falls back safely to in-memory datasets if the database is temporarily unreachable.

---

## 4. Production Deployment (Vercel)

When deploying to Vercel:

1. Open your project on the [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings** > **Environment Variables**.
3. Add the three keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set the environment targets to **Production**, **Preview**, and **Development**.
5. Trigger a deployment or redeploy the latest commit.

---

## 5. Rollback & Disaster Recovery

If you ever need to reset or roll back the schema, a complete rollback script is included at the bottom of:
`src/db/migrations/003_supabase_production_schema.sql`

Executing that rollback section drops all Brainnote tables and policies cleanly without leaving orphaned types or constraints.
