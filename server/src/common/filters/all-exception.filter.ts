import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

function httpExceptionBodyMessage(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') {
      return m;
    }
    if (Array.isArray(m)) {
      return m.map(String).join(', ');
    }
  }
  return 'Request failed';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body
      = exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status}`,
      exception instanceof Error ? exception.stack : 'No stack trace available',
    );

    response.status(status).json({
      code: status,
      success: false,
      message:
        exception instanceof HttpException
          ? httpExceptionBodyMessage(body)
          : typeof body === 'string'
            ? body
            : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
