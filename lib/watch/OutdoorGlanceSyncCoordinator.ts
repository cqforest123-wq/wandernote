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
      return;
    }

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
      await this.publisher(JSON.stringify(snapshot));
      this.lastPublishedFingerprint = pending.fingerprint;
    } catch (error) {
      this.pending = pending;
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
