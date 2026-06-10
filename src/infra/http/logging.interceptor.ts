import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const correlationId = (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    res.setHeader('x-correlation-id', correlationId);

    const start = Date.now();
    const { method, url } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${Date.now() - start}ms cid=${correlationId}`,
          );
        },
        error: () => {
          this.logger.log(`${method} ${url} ERR ${Date.now() - start}ms cid=${correlationId}`);
        },
      }),
    );
  }
}
