import {
  composeOutdoorGlanceSnapshot,
  fingerprintOutdoorGlanceInput,
} from './composeOutdoorGlanceSnapshot';
import { ComposeOutdoorGlanceSnapshotInput } from './OutdoorGlanceSnapshot';

export type OutdoorGlanceSnapshotPublisher = (
  snapshotJson: string
) => Promise<unknown> | unknown;

export type OutdoorGlanceSyncCoordinatorOptions = {
  publisher: OutdoorGlanceSnapshotPublisher;
  debounceMs?: number;
  onError?: (error: unknown) => void;
};

export type OutdoorGlanceSyncScheduleOptions = {
  force?: boolean;
};

type PendingPublish = {
  input: ComposeOutdoorGlanceSnapshotInput;
  fingerprint: string;
};

function isOutdoorGlanceDebugEnabled(): boolean {
  return Boolean(
    (globalThis as unknown as { __DEV__?: boolean }).__DEV__
  );
}

function logOutdoorGlanceDebug(message: string): void {
  if (isOutdoorGlanceDebugEnabled()) {
    console.debug(`[OutdoorGlance] ${message}`);
  }
}

export class OutdoorGlanceSyncCoordinator {
  private readonly publisher: OutdoorGlanceSnapshotPublisher;
  private readonly debounceMs: number;
  private readonly onError?: (error: unknown) => void;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: PendingPublish | null = null;
  private lastPublishedFingerprint: string | null = null;

  constructor({
    publisher,
    debounceMs = 1200,
    onError,
  }: OutdoorGlanceSyncCoordinatorOptions) {
    this.publisher = publisher;
    this.debounceMs = Math.max(0, debounceMs);
    this.onError = onError;
  }

  schedule(
    input: ComposeOutdoorGlanceSnapshotInput,
    options: OutdoorGlanceSyncScheduleOptions = {}
  ): void {
    const fingerprint = fingerprintOutdoorGlanceInput(input);

    if (!options.force && fingerprint === this.lastPublishedFingerprint) {
      logOutdoorGlanceDebug('payload skipped due to duplicate fingerprint');
      return;
    }

    logOutdoorGlanceDebug(
      options.force
        ? 'snapshot send scheduled with foreground force'
        : 'snapshot send scheduled'
    );

    this.pending = {
      input,
      fingerprint,
    };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.debounceMs);
  }

  async flush(): Promise<void> {
    const pending = this.pending;
    if (!pending) {
      return;
    }

    this.pending = null;

    try {
      const snapshot = composeOutdoorGlanceSnapshot(pending.input);
      logOutdoorGlanceDebug('snapshot composed');
      await this.publisher(JSON.stringify(snapshot));
      logOutdoorGlanceDebug('payload sent to native bridge');
      this.lastPublishedFingerprint = pending.fingerprint;
    } catch (error) {
      this.pending = pending;
      logOutdoorGlanceDebug('payload retained after send failure');
      this.onError?.(error);
    }
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.pending = null;
  }
}
