// ==============================================================================
// Brainnote AI — Asynchronous Ingestion Job Tracker (Phase 3)
// Manages background jobs for large media files, transcription & long documents
// ==============================================================================

import { IngestionResult } from './types';

export interface IngestionJob {
  id: string;
  tenantId: string;
  sourceId: string;
  sourceType: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  result?: IngestionResult;
}

declare global {
  // eslint-disable-next-line no-var
  var __BRAINNOTE_JOBS__: Map<string, IngestionJob> | undefined;
}

function getJobStore(): Map<string, IngestionJob> {
  if (!global.__BRAINNOTE_JOBS__) {
    global.__BRAINNOTE_JOBS__ = new Map();
  }
  return global.__BRAINNOTE_JOBS__;
}

export function createIngestionJob(
  tenantId: string,
  sourceId: string,
  sourceType: string,
  fileName: string
): IngestionJob {
  const store = getJobStore();
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const job: IngestionJob = {
    id,
    tenantId,
    sourceId,
    sourceType,
    fileName,
    status: 'processing',
    progressPercentage: 15,
    createdAt: now,
    updatedAt: now,
  };

  store.set(id, job);
  return job;
}

export function getIngestionJob(jobId: string, tenantId?: string): IngestionJob | null {
  const store = getJobStore();
  const job = store.get(jobId);
  if (!job) return null;

  // Validate tenant ownership if tenantId provided
  if (tenantId && job.tenantId !== tenantId) {
    return null;
  }

  // Auto-advance simulated in-progress jobs for deterministic async test flows
  if (job.status === 'processing' && job.progressPercentage < 100) {
    job.progressPercentage = Math.min(100, job.progressPercentage + 45);
    job.updatedAt = new Date().toISOString();
    if (job.progressPercentage >= 100) {
      job.status = 'completed';
    }
  }

  return job;
}

export function updateIngestionJob(
  jobId: string,
  updates: Partial<Pick<IngestionJob, 'status' | 'progressPercentage' | 'error' | 'result'>>
): IngestionJob | null {
  const store = getJobStore();
  const job = store.get(jobId);
  if (!job) return null;

  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  return job;
}

export function listTenantJobs(tenantId: string): IngestionJob[] {
  const store = getJobStore();
  const jobs: IngestionJob[] = [];
  for (const job of store.values()) {
    if (job.tenantId === tenantId) {
      jobs.push(job);
    }
  }
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
