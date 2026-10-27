// ==============================================================================
// Brainnote AI — Collaborators & Multi-User Sharing API
// GET /api/collaborators?tenantId=...
// POST /api/collaborators
// DELETE /api/collaborators
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCollaborators, inviteCollaborator, removeCollaborator } from '@/lib/server-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-acme';

    const collaborators = getCollaborators(tenantId);
    return NextResponse.json({
      success: true,
      tenantId,
      collaborators,
      count: collaborators.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-acme', email, name, role = 'editor' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required to invite a collaborator.' },
        { status: 400 }
      );
    }

    const collaborator = inviteCollaborator(tenantId, email, name, role);

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email} with ${role.toUpperCase()} permissions.`,
      collaborator,
      shareLink: `http://localhost:3000/share?tenantId=${tenantId}&invite=${collaborator.id}`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to invite collaborator' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-acme', collabId } = body;

    if (!collabId) {
      return NextResponse.json(
        { error: 'collabId is required to revoke access.' },
        { status: 400 }
      );
    }

    const removed = removeCollaborator(tenantId, collabId);
    return NextResponse.json({
      success: removed,
      message: removed ? 'Collaborator access revoked successfully.' : 'Collaborator not found.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
