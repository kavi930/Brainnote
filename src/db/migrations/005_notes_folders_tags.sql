-- ==============================================================================
-- Brainnote AI — Migration 005: Notes Folders, Tags & Organization
-- Non-destructive, idempotent migration for My Notes workspace
-- ==============================================================================

-- 1. Add folder_id and tags columns to notes if not already present
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id VARCHAR(100);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 2. Indexes for fast note list querying and sorting
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(tenant_id, folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(tenant_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(tenant_id, updated_at DESC);

-- ==============================================================================
-- ROLLBACK SCRIPT (Execute if reverting Migration 005)
-- ==============================================================================
-- DROP INDEX IF EXISTS idx_notes_folder;
-- DROP INDEX IF EXISTS idx_notes_pinned;
-- DROP INDEX IF EXISTS idx_notes_updated;
-- ALTER TABLE notes DROP COLUMN IF EXISTS folder_id;
-- ALTER TABLE notes DROP COLUMN IF EXISTS tags;

