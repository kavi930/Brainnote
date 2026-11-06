// ==============================================================================
// Brainnote AI — Cross-Source Grounded RAG Search Endpoint
// POST /api/search/grounded
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchAndAnswerGrounded } from '@/lib/ai-provider';
import { getTenantStoreAsync } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, tenantId, selectedSourceIds, persona, customInstructions } = body;

    if (!query || !tenantId) {
      return NextResponse.json(
        { error: 'Query and tenantId are required for grounded search.' },
        { status: 400 }
      );
    }

    // Resolve tenant dataset strictly from live store (enforces data isolation)
    const tenantDataset = await getTenantStoreAsync(tenantId);
    if (tenantDataset.tenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized tenant access attempt.' },
        { status: 403 }
      );
    }

    // Collect all valid source IDs owned by this tenant
    const ownedSourceIds = new Set<string>();
    for (const note of tenantDataset.notes) {
      for (const src of note.sources || []) {
        ownedSourceIds.add(src.id);
      }
      ownedSourceIds.add(note.id);
    }

    // Validate that selectedSourceIds strictly belong to this tenant
    let validatedSourceIds: string[] | undefined = undefined;
    if (Array.isArray(selectedSourceIds)) {
      const invalidIds = selectedSourceIds.filter((id) => !ownedSourceIds.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Unauthorized source access attempt. Selected sources do not belong to tenant: ${invalidIds.join(', ')}` },
          { status: 403 }
        );
      }
      validatedSourceIds = selectedSourceIds;
    }

    const groundedResult = await searchAndAnswerGrounded(
      query, 
      tenantDataset.notes,
      validatedSourceIds,
      persona,
      customInstructions
    );

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
