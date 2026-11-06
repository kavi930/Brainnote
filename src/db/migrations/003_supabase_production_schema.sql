-- ==============================================================================
-- Brainnote AI — Migration 003: Supabase Production Schema & Row-Level Security
-- Target: Supabase PostgreSQL (Free / Pro Tier)
-- Architecture: Multi-Tenant Knowledge Workspace (NotebookLM Paradigm)
-- Idempotent: Safe to execute repeatedly without duplicating records or errors
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE MULTI-TENANT TABLES
-- ==============================================================================

-- 2.1 Tenants (Organizations / Customer Workspaces)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'trial', -- 'trial', 'pro', 'team'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- 2.2 Users (Scoped to Tenant)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2.3 Subscriptions (Stripe Lifecycle & 7-Day Free Trial)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'trial', -- 'trial', 'pro', 'team'
    status VARCHAR(50) NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 'canceled'
    trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    has_payment_method BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method_brand VARCHAR(50),
    payment_method_last4 VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);

-- 2.4 Usage Records (Atomic Quotas & Metering)
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    billing_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    ai_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    ai_tokens_limit BIGINT NOT NULL DEFAULT 50000,
    storage_bytes_consumed BIGINT NOT NULL DEFAULT 0,
    storage_bytes_limit BIGINT NOT NULL DEFAULT 262144000, -- 250 MB
    notes_count INT NOT NULL DEFAULT 0,
    notes_limit INT NOT NULL DEFAULT 25,
    audio_minutes_transcribed INT NOT NULL DEFAULT 0,
    audio_minutes_limit INT NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_usage_period UNIQUE (tenant_id, billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tenant ON usage_records(tenant_id);

-- ==============================================================================
-- 3. THREE-PANEL KNOWLEDGE WORKSPACE ENTITIES
-- ==============================================================================

-- 3.1 Notebooks (Primary Top-Level Container)
CREATE TABLE IF NOT EXISTS notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled Notebook',
    description TEXT,
    persona VARCHAR(50) NOT NULL DEFAULT 'default', -- 'default', 'teacher', 'technical', 'executive', 'beginner', 'exam_prep', 'research', 'custom'
    custom_instructions TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notebooks_tenant ON notebooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);

-- 3.2 Notes (Saved Notes inside Notebooks)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled Note',
    content TEXT NOT NULL DEFAULT '',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_tenant ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id);

-- 3.3 Note Sources (Multimodal Evidence: YouTube, Web, PDF, DOCX, Audio, Meeting)
CREATE TABLE IF NOT EXISTS note_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'youtube', 'web', 'pdf', 'audio', 'video', 'meeting', 'presentation', 'document'
    title VARCHAR(500) NOT NULL,
    source_url TEXT,
    file_storage_key TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    raw_transcript TEXT,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_sources_tenant ON note_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_note_sources_note ON note_sources(note_id);

-- 3.4 Notebook Sources Junction (Selective Grounding Checkbox State)
CREATE TABLE IF NOT EXISTS notebook_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES note_sources(id) ON DELETE CASCADE,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE, -- Checked for AI Grounding
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notebook_source_pair UNIQUE (notebook_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_notebook_sources_notebook ON notebook_sources(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_sources_source ON notebook_sources(source_id);

-- 3.5 Notebook Conversations (Per-Notebook Conversational Chat Threads)
CREATE TABLE IF NOT EXISTS notebook_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb, -- Array of { sourceId, sourceTitle, formattedReference, citationText }
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_notebook ON notebook_conversations(notebook_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON notebook_conversations(tenant_id);

-- 3.6 AI Artifacts (Studio Group A, B, C, D Persistent Outputs)
CREATE TABLE IF NOT EXISTS ai_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL, -- 'summary', 'meeting_minutes', 'action_items', 'study_guide', 'flashcards', 'quiz', 'qa', 'interview_qa'
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    model_used VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-pro',
    tokens_consumed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_artifacts_tenant ON ai_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_note ON ai_artifacts(note_id);

-- 3.7 Collaborators (Workspace Sharing)
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'editor', -- 'editor', 'viewer'
    status VARCHAR(50) NOT NULL DEFAULT 'invited', -- 'active', 'invited'
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_collaborator_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_tenant ON collaborators(tenant_id);

-- ==============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) FOR STRICT MULTI-TENANT ISOLATION
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist (guarantees safe re-runs without 42710 error)
DROP POLICY IF EXISTS rls_tenant_isolation_notebooks ON notebooks;
DROP POLICY IF EXISTS tenant_isolation_notebooks ON notebooks;
DROP POLICY IF EXISTS rls_tenant_isolation_notes ON notes;
DROP POLICY IF EXISTS tenant_isolation_notes_select ON notes;
DROP POLICY IF EXISTS tenant_isolation_notes_insert ON notes;
DROP POLICY IF EXISTS tenant_isolation_notes_update ON notes;
DROP POLICY IF EXISTS tenant_isolation_notes_delete ON notes;
DROP POLICY IF EXISTS rls_tenant_isolation_sources ON note_sources;
DROP POLICY IF EXISTS tenant_isolation_sources ON note_sources;
DROP POLICY IF EXISTS rls_tenant_isolation_conversations ON notebook_conversations;
DROP POLICY IF EXISTS tenant_isolation_notebook_conversations ON notebook_conversations;
DROP POLICY IF EXISTS rls_tenant_isolation_artifacts ON ai_artifacts;
DROP POLICY IF EXISTS tenant_isolation_ai_artifacts ON ai_artifacts;
DROP POLICY IF EXISTS rls_tenant_isolation_collaborators ON collaborators;
DROP POLICY IF EXISTS rls_tenant_isolation_notebook_sources ON notebook_sources;
DROP POLICY IF EXISTS tenant_isolation_notebook_sources ON notebook_sources;

-- Define Policies: Service Role (Server Backend) has full CRUD bypass when verified
-- Public / Authenticated Users are restricted to their matching tenant_id
CREATE POLICY rls_tenant_isolation_notebooks ON notebooks
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );

CREATE POLICY rls_tenant_isolation_notes ON notes
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );

CREATE POLICY rls_tenant_isolation_sources ON note_sources
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY rls_tenant_isolation_notebook_sources ON notebook_sources
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM notebooks 
            WHERE notebooks.id = notebook_sources.notebook_id 
            AND (
                notebooks.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                OR (auth.uid() IS NOT NULL AND notebooks.user_id = auth.uid())
            )
        )
    );

CREATE POLICY rls_tenant_isolation_conversations ON notebook_conversations
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY rls_tenant_isolation_artifacts ON ai_artifacts
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY rls_tenant_isolation_collaborators ON collaborators
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);



-- ==============================================================================
-- 5. IDEMPOTENT INITIAL SEED DATA (ACME DEMO WORKSPACE)
-- Preserves existing notes, sources, and AI artifacts without duplicate keys
-- ==============================================================================

-- Seed Acme Tenant
INSERT INTO tenants (id, name, slug, tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Engineering', 'acme-corp', 'trial')
ON CONFLICT (slug) DO NOTHING;

-- Seed Owner User
INSERT INTO users (id, tenant_id, email, name, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'alex@acme.corp',
    'Alex Rivera',
    'owner'
)
ON CONFLICT (email) DO NOTHING;

-- Seed Default Subscription
INSERT INTO subscriptions (tenant_id, plan_tier, status, has_payment_method)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'trial',
    'trialing',
    TRUE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Seed Default Usage
INSERT INTO usage_records (tenant_id, billing_period_start, ai_tokens_consumed, notes_count)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2026-11-01 00:00:00+00',
    18450,
    2
)
ON CONFLICT (tenant_id, billing_period_start) DO NOTHING;

-- ==============================================================================
-- 6. SAFE ROLLBACK PROCEDURE
-- In the event of a rollback, execute the following SQL in reverse order:
--
-- DROP POLICY IF EXISTS rls_tenant_isolation_collaborators ON collaborators;
-- DROP POLICY IF EXISTS rls_tenant_isolation_artifacts ON ai_artifacts;
-- DROP POLICY IF EXISTS rls_tenant_isolation_conversations ON notebook_conversations;
-- DROP POLICY IF EXISTS rls_tenant_isolation_sources ON note_sources;
-- DROP POLICY IF EXISTS rls_tenant_isolation_notes ON notes;
-- DROP POLICY IF EXISTS rls_tenant_isolation_notebooks ON notebooks;
-- DROP TABLE IF EXISTS collaborators CASCADE;
-- DROP TABLE IF EXISTS ai_artifacts CASCADE;
-- DROP TABLE IF EXISTS notebook_conversations CASCADE;
-- DROP TABLE IF EXISTS notebook_sources CASCADE;
-- DROP TABLE IF EXISTS note_sources CASCADE;
-- DROP TABLE IF EXISTS notes CASCADE;
-- DROP TABLE IF EXISTS notebooks CASCADE;
-- DROP TABLE IF EXISTS usage_records CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS tenants CASCADE;
-- ==============================================================================
