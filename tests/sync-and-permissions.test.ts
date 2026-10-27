// ==============================================================================
// Brainnote AI — Offline Sync & Recording Permissions Tests (Phase 4)
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { OfflineSyncEngine } from '../src/lib/sync/offline-sync-engine';
import { RecordingPermissionsGuard } from '../src/lib/permissions/recording-guard';
import { Note } from '../src/types';

describe('Phase 4: Offline Synchronization & Recording Permissions Guard', () => {
  describe('Offline Sync Engine', () => {
    it('enqueues mutations and retains pending queue', () => {
      const syncEngine = new OfflineSyncEngine();
      syncEngine.setOnlineStatus(false);

      const m1 = syncEngine.enqueueMutation(
        'tenant-acme',
        'user-1',
        'CREATE_NOTE',
        'note-101',
        { title: 'Offline Note 1' }
      );

      const m2 = syncEngine.enqueueMutation(
        'tenant-acme',
        'user-1',
        'UPDATE_NOTE',
        'note-101',
        { content: 'Added content while on train' }
      );

      expect(syncEngine.getPendingQueue().length).toBe(2);
      expect(m1.status).toBe('pending');
      expect(m2.payload.content).toBe('Added content while on train');
    });

    it('resolves conflicts giving precedence to newer client edits with non-destructive merge', () => {
      const syncEngine = new OfflineSyncEngine();

      const serverNote: Note = {
        id: 'note-1',
        tenantId: 'tenant-acme',
        userId: 'user-1',
        title: 'Original Title',
        content: 'Server content',
        isPinned: false,
        isArchived: false,
        tags: [{ id: 't-1', tenantId: 'tenant-acme', name: 'Work', color: '#000' }],
        sources: [],
        aiArtifacts: [],
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z',
      };

      const clientNote: Note = {
        ...serverNote,
        title: 'Newer Client Title',
        tags: [
          { id: 't-1', tenantId: 'tenant-acme', name: 'Work', color: '#000' },
          { id: 't-2', tenantId: 'tenant-acme', name: 'Urgent', color: '#F00' },
        ],
        updatedAt: '2026-10-20T12:00:00Z', // 2 hours newer
      };

      const conflict = syncEngine.resolveConflict(clientNote, serverNote);

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.resolutionStrategy).toBe('MERGED');
      expect(conflict.resolvedNote.title).toBe('Newer Client Title');
      expect(conflict.resolvedNote.tags.length).toBe(2);
    });

    it('flushes pending mutations when connectivity is restored', async () => {
      const syncEngine = new OfflineSyncEngine();
      syncEngine.enqueueMutation('tenant-acme', 'user-1', 'UPDATE_NOTE', 'note-1', {
        title: 'Pending Sync',
      });

      syncEngine.setOnlineStatus(true);
      const result = await syncEngine.flushSyncQueue(async (m) => {
        return m.noteId === 'note-1';
      });

      expect(result.applied).toBe(1);
      expect(result.failed).toBe(0);
      expect(syncEngine.getPendingQueue().length).toBe(0);
    });
  });

  describe('Recording Permissions Guard', () => {
    it('throws error when user consent is declined', () => {
      const guard = new RecordingPermissionsGuard();

      expect(() =>
        guard.requestRecordingAuthorization({
          tenantId: 'tenant-acme',
          sourceType: 'screen',
          explicitUserConsent: false,
          systemPermissionGranted: true,
        })
      ).toThrow('User declined explicit recording permission prompt');
    });

    it('throws error when OS permissions are missing', () => {
      const guard = new RecordingPermissionsGuard();

      expect(() =>
        guard.requestRecordingAuthorization({
          tenantId: 'tenant-acme',
          sourceType: 'system_audio',
          explicitUserConsent: true,
          systemPermissionGranted: false,
        })
      ).toThrow('Operating system audio/screen capture permission denied');
    });

    it('initiates active session with pulsing visual indicators when authorized', () => {
      const guard = new RecordingPermissionsGuard();

      const session = guard.requestRecordingAuthorization({
        tenantId: 'tenant-acme',
        sourceType: 'screen',
        explicitUserConsent: true,
        systemPermissionGranted: true,
      });

      expect(session.isRecordingActive).toBe(true);
      expect(session.indicator.visible).toBe(true);
      expect(session.indicator.label).toBe('SCREEN RECORDING ACTIVE');
      expect(session.indicator.color).toBe('#E11D48');

      // Stop recording
      const stopped = guard.stopRecording();
      expect(stopped.sessionId).toBe(session.sessionId);
      expect(guard.getActiveSession()?.isRecordingActive).toBe(false);
      expect(guard.getActiveSession()?.indicator.visible).toBe(false);
    });
  });
});
