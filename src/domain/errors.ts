export class InvalidTimeRangeError extends Error {
  constructor(message = 'start must be strictly before end') {
    super(message);
    this.name = 'InvalidTimeRangeError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OverlapError extends Error {
  constructor(message = 'requested time overlaps an existing appointment for this clinician') {
    super(message);
    this.name = 'OverlapError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PastAppointmentError extends Error {
  constructor(message = 'appointment cannot start in the past') {
    super(message);
    this.name = 'PastAppointmentError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
