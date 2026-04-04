import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@root/generated/prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      const target = (exception.meta?.target as string[])?.join(', ') || 'field';
      message = `A record with this ${target} already exists.`;
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'The requested record was not found.';
    }

    this.logger.error(`${request.method} ${request.url} - Prisma Error ${exception.code}: ${message}`);

    response.status(status).json({
      code: status,
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
