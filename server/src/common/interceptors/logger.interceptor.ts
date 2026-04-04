import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const method = request.method;
    const url = request.originalUrl;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse();
          const statusCode = response.statusCode;
          this.logger.log(`${method} ${url} ${statusCode} - ${Date.now() - now}ms`);
        },
        error: (error) => {
          const statusCode = error.status || 500;
          this.logger.error(`${method} ${url} ${statusCode} - ${Date.now() - now}ms`, error.stack);
        },
      }),
    );
  }
}
