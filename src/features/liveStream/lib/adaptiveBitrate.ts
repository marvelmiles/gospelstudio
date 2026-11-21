export type StreamHealth = "good" | "weak" | "poor";

export interface BitrateRange {
  minKbps: number;
  maxKbps: number;
  audioKbps: number;
}

export interface BitrateDecision {
  targetKbps: number;
  dropVideo: boolean;
  bufferedMs: number;
  health: StreamHealth;
}

const DROP_VIDEO_AFTER_MS = 4000;
const CUT_HARD_AFTER_MS = 1500;
const CUT_SOFT_AFTER_MS = 600;
const CALM_BELOW_MS = 250;
const CALM_SECONDS_BEFORE_RAISING = 8;
const HARD_CUT = 0.7;
const SOFT_CUT = 0.9;
const RAISE = 1.1;
const GOOD_SHARE_OF_MAX = 0.75;

export class AdaptiveBitrate {
  private readonly range: BitrateRange;
  private target: number;
  private calmSeconds = 0;

  constructor(range: BitrateRange) {
    this.range = range;
    this.target = range.maxKbps;
  }

  get targetKbps(): number {
    return this.target;
  }

  update(bufferedBytes: number): BitrateDecision {
    const sendKbps = this.target + this.range.audioKbps;
    const bufferedMs = Math.round((bufferedBytes * 8) / sendKbps);

    if (bufferedMs >= CUT_HARD_AFTER_MS) this.cut(HARD_CUT);
    else if (bufferedMs >= CUT_SOFT_AFTER_MS) this.cut(SOFT_CUT);
    else if (bufferedMs < CALM_BELOW_MS) this.calmDown();
    else this.calmSeconds = 0;

    return {
      targetKbps: this.target,
      dropVideo: bufferedMs >= DROP_VIDEO_AFTER_MS,
      bufferedMs,
      health: this.healthFor(bufferedMs),
    };
  }

  private cut(factor: number): void {
    this.calmSeconds = 0;
    this.target = Math.max(
      this.range.minKbps,
      Math.round(this.target * factor),
    );
  }

  private calmDown(): void {
    this.calmSeconds += 1;
    if (this.calmSeconds < CALM_SECONDS_BEFORE_RAISING) return;
    this.calmSeconds = 0;
    this.target = Math.min(this.range.maxKbps, Math.round(this.target * RAISE));
  }

  private healthFor(bufferedMs: number): StreamHealth {
    if (bufferedMs >= CUT_HARD_AFTER_MS) return "poor";
    if (this.target <= this.range.minKbps && bufferedMs >= CUT_SOFT_AFTER_MS)
      return "poor";
    if (
      bufferedMs < CUT_SOFT_AFTER_MS &&
      this.target >= this.range.maxKbps * GOOD_SHARE_OF_MAX
    )
      return "good";
    return "weak";
  }
}
