-- ==============================================================================
-- Migration 002: Notebooks, Notebook Conversations & Source Grounding
-- Authoritative Database Target: PostgreSQL 15+ / Supabase / AWS Aurora
-- Backward Compatibility: Non-destructive migration preserving all existing notes,
-- sources, artifacts, users, and tenant relationships.
-- ==============================================================================

-- 1. Create Notebooks Table
CREATE TABLE IF NOT EXISTS notebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_notebooks_tenant_id ON notebooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);

-- 2. Create Notebook Selected Sources Junction (Selective Grounding)
CREATE TABLE IF NOT EXISTS notebook_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES note_sources(id) ON DELETE CASCADE,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE, -- checked for grounding
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notebook_source UNIQUE (notebook_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_notebook_sources_notebook ON notebook_sources(notebook_id);

-- 3. Create Notebook Conversations (Per-Notebook Chat History)
CREATE TABLE IF NOT EXISTS notebook_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notebook_conv_notebook ON notebook_conversations(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_conv_tenant ON notebook_conversations(tenant_id);

-- 4. Backward-Compatible Data Migration (1:1 Note -> Notebook Seed)
-- Preserves all notes as primary notebooks without duplicating or deleting records
INSERT INTO notebooks (id, tenant_id, user_id, title, description, created_at, updated_at)
SELECT 
    id, 
    tenant_id, 
    user_id, 
    title, 
    SUBSTRING(content FROM 1 FOR 300), 
    created_at, 
    updated_at
FROM notes
ON CONFLICT (id) DO NOTHING;

-- Map existing note_sources into notebook_sources
INSERT INTO notebook_sources (notebook_id, source_id, is_selected, added_at)
SELECT 
    note_id, 
    id, 
    TRUE, 
    created_at
FROM note_sources
ON CONFLICT (notebook_id, source_id) DO NOTHING;

-- 5. Enable Row-Level Security (RLS)
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_notebooks ON notebooks
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_notebook_conversations ON notebook_conversations
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS
-- In the event of a rollback, execute the following SQL in reverse order:
--
-- DROP POLICY IF EXISTS tenant_isolation_notebook_conversations ON notebook_conversations;
-- DROP POLICY IF EXISTS tenant_isolation_notebooks ON notebooks;
-- DROP TABLE IF EXISTS notebook_conversations CASCADE;
-- DROP TABLE IF EXISTS notebook_sources CASCADE;
-- DROP TABLE IF EXISTS notebooks CASCADE;
--
-- NOTE: Existing tables (notes, note_sources, ai_artifacts, subscriptions, users,
-- tenants) remain 100% untouched and preserved.
-- ==============================================================================
