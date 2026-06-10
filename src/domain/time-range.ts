import { InvalidTimeRangeError } from './errors';

export class TimeRange {
  readonly startMs: number;
  readonly endMs: number;

  constructor(startMs: number, endMs: number) {
    if (startMs >= endMs) {
      throw new InvalidTimeRangeError();
    }
    this.startMs = startMs;
    this.endMs = endMs;
  }

  get start(): Date {
    return new Date(this.startMs);
  }

  get end(): Date {
    return new Date(this.endMs);
  }

  overlaps(other: TimeRange): boolean {
    return this.startMs < other.endMs && this.endMs > other.startMs;
  }
}
