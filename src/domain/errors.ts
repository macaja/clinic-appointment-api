export class InvalidTimeRangeError extends Error {
  constructor(message = 'start must be strictly before end') {
    super(message);
    this.name = 'InvalidTimeRangeError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
