import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { InvalidTimeRangeError, PastAppointmentError, OverlapError } from '../../domain/errors';

type DomainError = InvalidTimeRangeError | PastAppointmentError | OverlapError;

@Catch(InvalidTimeRangeError, PastAppointmentError, OverlapError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof OverlapError ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;

    response.status(statusCode).json({
      statusCode,
      error: exception.name,
      message: exception.message,
    });
  }
}
