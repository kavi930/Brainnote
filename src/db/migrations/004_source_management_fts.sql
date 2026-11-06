-- ==============================================================================
-- Brainnote AI — Migration 004: Source Management, FTS & Duplicate Detection
-- Stage 3B: Real Source Management
-- Safe & Idempotent Migration
-- ==============================================================================

-- 1. Full-Text Search Indexes on Sources and Notes
CREATE INDEX IF NOT EXISTS idx_note_sources_fts 
ON note_sources 
USING gin(to_tsvector('english', title || ' ' || COALESCE(raw_transcript, '')));

CREATE INDEX IF NOT EXISTS idx_notes_fts 
ON notes 
USING gin(to_tsvector('english', title || ' ' || content));

-- 2. Performance Indexes for Source Library Queries
CREATE INDEX IF NOT EXISTS idx_note_sources_status 
ON note_sources(tenant_id, processing_status);

CREATE INDEX IF NOT EXISTS idx_note_sources_type 
ON note_sources(tenant_id, source_type);

-- 3. Source Duplicate Detection Index (URL based within a tenant)
CREATE INDEX IF NOT EXISTS idx_note_sources_dedup_url 
ON note_sources(tenant_id, source_url) 
WHERE source_url IS NOT NULL;

-- ==============================================================================
-- ROLLBACK SCRIPT (Execute if reverting Migration 004)
-- ==============================================================================
-- DROP INDEX IF EXISTS idx_note_sources_fts;
-- DROP INDEX IF EXISTS idx_notes_fts;
-- DROP INDEX IF EXISTS idx_note_sources_status;
-- DROP INDEX IF EXISTS idx_note_sources_type;
-- DROP INDEX IF EXISTS idx_note_sources_dedup_url;
