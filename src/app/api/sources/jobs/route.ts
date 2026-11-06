// ==============================================================================
// Brainnote AI — Asynchronous Job Status Endpoint (Stage 3B)
// GET /api/sources/jobs?jobId=...&tenantId=...
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getIngestionJob, listTenantJobs } from '@/lib/ingestion/jobs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const tenantId = searchParams.get('tenantId') || 'tenant-acme';

    if (!jobId) {
      // List all jobs for tenant
      const jobs = listTenantJobs(tenantId);
      return NextResponse.json({
        success: true,
        tenantId,
        count: jobs.length,
        jobs,
      });
    }

    const job = getIngestionJob(jobId, tenantId);
    if (!job) {
      return NextResponse.json(
        { error: `Job "${jobId}" not found or unauthorized.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Job status check failed' },
      { status: 500 }
    );
  }
}
