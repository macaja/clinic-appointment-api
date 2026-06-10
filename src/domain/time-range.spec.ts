import { TimeRange } from './time-range';
import { InvalidTimeRangeError } from './errors';

const h = (hour: number, minute = 0) => new Date(2024, 0, 1, hour, minute).getTime();

const makeBase = () => new TimeRange(h(10), h(11));

describe('TimeRange.overlaps', () => {
  it('should return false when other is entirely before', () => {
    const other = new TimeRange(h(8), h(9));
    const result = makeBase().overlaps(other);
    expect(result).toBe(false);
  });

  it('should return false when other is entirely after', () => {
    const other = new TimeRange(h(12), h(13));
    const result = makeBase().overlaps(other);
    expect(result).toBe(false);
  });

  it('should return false when other starts exactly at base end', () => {
    const other = new TimeRange(h(11), h(12));
    const result = makeBase().overlaps(other);
    expect(result).toBe(false);
  });

  it('should return false when other ends exactly at base start', () => {
    const other = new TimeRange(h(9), h(10));
    const result = makeBase().overlaps(other);
    expect(result).toBe(false);
  });

  it('should return true when other partially overlaps at front', () => {
    const other = new TimeRange(h(9, 30), h(10, 30));
    const result = makeBase().overlaps(other);
    expect(result).toBe(true);
  });

  it('should return true when other partially overlaps at back', () => {
    const other = new TimeRange(h(10, 30), h(11, 30));
    const result = makeBase().overlaps(other);
    expect(result).toBe(true);
  });

  it('should return true when other is contained within base', () => {
    const other = new TimeRange(h(10, 15), h(10, 45));
    const result = makeBase().overlaps(other);
    expect(result).toBe(true);
  });

  it('should return true when base is contained within other', () => {
    const other = new TimeRange(h(9), h(12));
    const result = makeBase().overlaps(other);
    expect(result).toBe(true);
  });

  it('should return true when ranges are identical', () => {
    const other = new TimeRange(h(10), h(11));
    const result = makeBase().overlaps(other);
    expect(result).toBe(true);
  });

  it('should be symmetric when ranges partially overlap', () => {
    const a = makeBase();
    const b = new TimeRange(h(10, 30), h(11, 30));
    expect(a.overlaps(b)).toBe(true);
    expect(b.overlaps(a)).toBe(true);
  });
});

describe('TimeRange constructor', () => {
  it('should throw InvalidTimeRangeError when start equals end', () => {
    const ms = h(10);
    expect(() => new TimeRange(ms, ms)).toThrow(InvalidTimeRangeError);
  });

  it('should throw InvalidTimeRangeError when start is after end', () => {
    expect(() => new TimeRange(h(11), h(10))).toThrow(InvalidTimeRangeError);
  });
});
