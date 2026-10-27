// ==============================================================================
// Brainnote AI — GDPR & SOC2 Data Export Endpoint
// GET /api/account/export?tenantId=...
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantStore } from '@/lib/server-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId query parameter is mandatory.' },
        { status: 400 }
      );
    }

    const dataset = getTenantStore(tenantId);
    if (!dataset) {
      return NextResponse.json(
        { error: 'Tenant record not found or access denied.' },
        { status: 404 }
      );
    }

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: '2.0.0',
        system: 'Brainnote AI Knowledge Companion',
        compliance: 'GDPR Article 20 / CCPA Data Portability Compliant',
      },
      tenant: dataset.tenant,
      user: dataset.user,
      subscription: dataset.subscription,
      usage: dataset.usage,
      folders: dataset.folders,
      tags: dataset.tags,
      notes: dataset.notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isPinned: n.isPinned,
        isArchived: n.isArchived,
        tags: n.tags,
        sources: n.sources.map((s) => ({
          id: s.id,
          sourceType: s.sourceType,
          title: s.title,
          sourceUrl: s.sourceUrl,
          durationSeconds: s.durationSeconds,
          rawTranscript: s.rawTranscript,
          processingStatus: s.processingStatus,
        })),
        aiArtifacts: n.aiArtifacts,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brainnote-export-${dataset.tenant.slug}-${Date.now()}.json"`,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Export generation failed' },
      { status: 500 }
    );
  }
}
