// ==============================================================================
// Brainnote AI — Cross-Source Grounded RAG Search Endpoint
// POST /api/search/grounded
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchAndAnswerGrounded } from '@/lib/ai-provider';
import { getTenantStore } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, tenantId } = body;

    if (!query || !tenantId) {
      return NextResponse.json(
        { error: 'Query and tenantId are required for grounded search.' },
        { status: 400 }
      );
    }

    // Resolve tenant dataset strictly from live store (enforces data isolation)
    const tenantDataset = getTenantStore(tenantId);
    if (tenantDataset.tenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized tenant access attempt.' },
        { status: 403 }
      );
    }

    const groundedResult = await searchAndAnswerGrounded(query, tenantDataset.notes);

    return NextResponse.json({
      success: true,
      query,
      answer: groundedResult.answer,
      citations: groundedResult.citations,
      confidence: groundedResult.confidence,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Grounded search failed' },
      { status: 500 }
    );
  }
}
