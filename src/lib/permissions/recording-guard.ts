// ==============================================================================
// Brainnote AI — Screen & Audio Recording Permissions Guard (Phase 4)
// Enforces mandatory explicit consent, system permissions, and visual indicators
// ==============================================================================

export interface RecordingSessionState {
  sessionId: string;
  tenantId: string;
  sourceType: 'screen' | 'system_audio' | 'microphone';
  isRecordingActive: boolean;
  hasExplicitUserConsent: boolean;
  hasSystemAudioPermission: boolean;
  startTime?: number;
  durationSeconds: number;
  indicator: {
    visible: boolean;
    label: string;
    color: string; // e.g. '#E11D48' (Active Red)
    isPulsing: boolean;
  };
}

export class RecordingPermissionsGuard {
  private activeSession: RecordingSessionState | null = null;

  /**
   * Request authorization to initiate screen or system audio capture.
   * Throws an error if explicit affirmative consent is not provided.
   */
  public requestRecordingAuthorization(params: {
    tenantId: string;
    sourceType: 'screen' | 'system_audio' | 'microphone';
    explicitUserConsent: boolean;
    systemPermissionGranted: boolean;
  }): RecordingSessionState {
    if (!params.explicitUserConsent) {
      throw new Error(
        'Recording aborted: User declined explicit recording permission prompt.'
      );
    }

    if (!params.systemPermissionGranted) {
      throw new Error(
        'Recording aborted: Operating system audio/screen capture permission denied.'
      );
    }

    const sessionId = `rec-${Date.now()}`;

    this.activeSession = {
      sessionId,
      tenantId: params.tenantId,
      sourceType: params.sourceType,
      isRecordingActive: true,
      hasExplicitUserConsent: true,
      hasSystemAudioPermission: true,
      startTime: Date.now(),
      durationSeconds: 0,
      indicator: {
        visible: true,
        label: params.sourceType === 'screen' ? 'SCREEN RECORDING ACTIVE' : 'AUDIO CAPTURE ACTIVE',
        color: '#E11D48',
        isPulsing: true,
      },
    };

    return this.activeSession;
  }

  public getActiveSession(): RecordingSessionState | null {
    return this.activeSession;
  }

  /**
   * Stop active recording and dismantle the visual recording indicator
   */
  public stopRecording(): { sessionId: string; totalDurationSeconds: number } {
    if (!this.activeSession || !this.activeSession.isRecordingActive) {
      throw new Error('No active recording session to terminate.');
    }

    const duration = Math.floor(
      (Date.now() - (this.activeSession.startTime || Date.now())) / 1000
    );

    const sessionId = this.activeSession.sessionId;

    this.activeSession = {
      ...this.activeSession,
      isRecordingActive: false,
      durationSeconds: duration,
      indicator: {
        visible: false,
        label: 'RECORDING STOPPED',
        color: '#64748B',
        isPulsing: false,
      },
    };

    return { sessionId, totalDurationSeconds: duration };
  }
}
