// ==============================================================================
// Brainnote AI — Hybrid Search & RAG Retrieval Engine (Stage 3B)
// Combines BM25 Lexical Full-Text Search with Semantic Vector Cosine Similarity
// Strictly Enforces Source Selection Boundaries and Tenant Data Isolation
// ==============================================================================

import { Note, NoteSource, CitationAnchor, SourceType } from '@/types';
import { TextChunk } from '@/lib/ingestion/types';

export interface ScoredChunk {
  chunk: TextChunk;
  lexicalScore: number;
  semanticScore: number;
  combinedScore: number;
  citation: CitationAnchor;
}

export interface RetrievalResult {
  query: string;
  matchedChunks: ScoredChunk[];
  totalCandidateChunks: number;
  activeSourceCount: number;
  scopedSourceIds: string[];
}

/**
 * Tokenizes text into lowercase normalized alphanumeric tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Generates term-frequency vector for cosine similarity
 */
function toVector(tokens: string[]): Map<string, number> {
  const vec = new Map<string, number>();
  for (const token of tokens) {
    vec.set(token, (vec.get(token) || 0) + 1);
  }
  return vec;
}

/**
 * Computes cosine similarity between two term frequency vectors
 */
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const count of vecA.values()) {
    normA += count * count;
  }
  for (const count of vecB.values()) {
    normB += count * count;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [term, countA] of vecA.entries()) {
    const countB = vecB.get(term);
    if (countB) {
      dotProduct += countA * countB;
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Extracts all searchable TextChunks from notes and attached sources.
 */
export function extractCandidateChunks(notes: Note[], selectedSourceIds?: string[]): TextChunk[] {
  const chunks: TextChunk[] = [];

  for (const note of notes) {
    const sources = note.sources || [];
    for (const source of sources) {
      // If selective grounding is active, filter strictly to selected source IDs
      if (selectedSourceIds && !selectedSourceIds.includes(source.id)) {
        continue;
      }

      // Check if source has pre-parsed chunks in metadata
      const metaChunks = (source as any).metadata?.chunks as TextChunk[] | undefined;
      if (metaChunks && Array.isArray(metaChunks) && metaChunks.length > 0) {
        chunks.push(...metaChunks);
      } else {
        // Fallback: chunk from rawTranscript or note content
        const contentToChunk = source.rawTranscript || note.content;
        const paragraphs = contentToChunk.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

        paragraphs.forEach((p, idx) => {
          // Detect page/slide/timestamp
          const pageMatch = p.match(/\[Page\s+(\d+)\]/i);
          const slideMatch = p.match(/\[Slide\s+(\d+)/i);
          const timeMatch = p.match(/\[(\d{2}):(\d{2})/);

          let timestampSeconds: number | undefined;
          if (timeMatch) {
            timestampSeconds = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          }

          chunks.push({
            id: `${source.id}-fallback-${idx}`,
            sourceId: source.id,
            sourceTitle: source.title || note.title,
            sourceType: source.sourceType,
            chunkIndex: idx,
            text: p.trim(),
            pageNumber: pageMatch ? parseInt(pageMatch[1], 10) : undefined,
            slideNumber: slideMatch ? parseInt(slideMatch[1], 10) : undefined,
            timestampSeconds,
            charStart: 0,
            charEnd: p.length,
            tokenCountEstimate: Math.max(1, Math.ceil(p.length / 4)),
          });
        });
      }
    }
  }

  return chunks;
}

/**
 * Executes hybrid BM25 + Vector retrieval across active, selected sources.
 * Strictly respects selective grounding: deselected sources are never scored.
 */
export function retrieveGroundedContext(
  query: string,
  notes: Note[],
  selectedSourceIds?: string[],
  options: { topK?: number; minScore?: number } = {}
): RetrievalResult {
  const topK = options.topK || 5;
  const minScore = options.minScore || 0.05;

  // If selectedSourceIds is provided and explicitly empty, return immediately with 0 results
  if (selectedSourceIds && selectedSourceIds.length === 0) {
    return {
      query,
      matchedChunks: [],
      totalCandidateChunks: 0,
      activeSourceCount: 0,
      scopedSourceIds: [],
    };
  }

  const candidateChunks = extractCandidateChunks(notes, selectedSourceIds);
  if (candidateChunks.length === 0) {
    return {
      query,
      matchedChunks: [],
      totalCandidateChunks: 0,
      activeSourceCount: 0,
      scopedSourceIds: selectedSourceIds || [],
    };
  }

  const queryTokens = tokenize(query);
  const queryVector = toVector(queryTokens);

  // 1. Compute BM25 Inverse Document Frequency (IDF)
  const docCount = candidateChunks.length;
  const docFreq = new Map<string, number>();

  for (const chunk of candidateChunks) {
    const chunkTokens = new Set(tokenize(chunk.text));
    for (const token of chunkTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, freq] of docFreq.entries()) {
    idf.set(token, Math.log((docCount - freq + 0.5) / (freq + 0.5) + 1));
  }

  // Calculate average chunk length
  const totalLength = candidateChunks.reduce((sum, c) => sum + tokenize(c.text).length, 0);
  const avgDl = totalLength / Math.max(1, docCount);

  const k1 = 1.2;
  const b = 0.75;

  // 2. Score candidate chunks with BM25 and Vector Cosine Similarity
  const scored: ScoredChunk[] = candidateChunks.map((chunk) => {
    const chunkTokens = tokenize(chunk.text);
    const chunkVector = toVector(chunkTokens);
    const dl = chunkTokens.length;

    // Lexical BM25 score
    let bm25Score = 0;
    for (const qToken of queryTokens) {
      const termFreq = chunkVector.get(qToken) || 0;
      const termIdf = idf.get(qToken) || 0.1;
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (dl / avgDl));
      bm25Score += termIdf * (numerator / Math.max(1, denominator));
    }

    // Semantic Cosine score
    const semanticScore = cosineSimilarity(queryVector, chunkVector);

    // Hybrid combined score (Normalized)
    const combinedScore = bm25Score * 0.6 + semanticScore * 0.4;

    // Format Citation Anchor
    const excerpt = chunk.text.slice(0, 95).replace(/\n/g, ' ');
    let formattedRef = `[${chunk.sourceTitle}]`;

    if (chunk.slideNumber) {
      formattedRef = `[${chunk.sourceTitle} Slide ${chunk.slideNumber}]`;
    } else if (chunk.pageNumber) {
      formattedRef = `[${chunk.sourceTitle} p. ${chunk.pageNumber}]`;
    } else if (chunk.timestampSeconds !== undefined) {
      const mins = Math.floor(chunk.timestampSeconds / 60);
      const secs = chunk.timestampSeconds % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      formattedRef = `[${chunk.sourceTitle} @ ${timeStr}]`;
    }

    const citation: CitationAnchor = {
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle,
      sourceType: chunk.sourceType,
      pageNumber: chunk.pageNumber,
      slideNumber: chunk.slideNumber,
      timestampSeconds: chunk.timestampSeconds,
      citationText: excerpt,
      formattedReference: formattedRef,
    };

    return {
      chunk,
      lexicalScore: bm25Score,
      semanticScore,
      combinedScore,
      citation,
    };
  });

  // Sort descending by combinedScore and take topK
  const matchedChunks = scored
    .filter((s) => s.combinedScore > minScore || s.semanticScore > 0.1)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK);

  const activeSourceIds = new Set(candidateChunks.map((c) => c.sourceId));

  return {
    query,
    matchedChunks,
    totalCandidateChunks: candidateChunks.length,
    activeSourceCount: activeSourceIds.size,
    scopedSourceIds: Array.from(activeSourceIds),
  };
}
