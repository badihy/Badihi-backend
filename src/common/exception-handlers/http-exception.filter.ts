import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { translateErrorMessage } from './arabic-error-messages';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = 500;
    let message: unknown = 'Internal server error';

    // Handle NestJS HttpExceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as any).message || exception.message;
    }

    // Handle Mongoose duplicate key error
    else if (
      exception instanceof MongoServerError &&
      exception.code === 11000
    ) {
      statusCode = 409;
      const field = Object.keys(exception.keyValue)[0];
      message = `Duplicate value for field "${field}": "${exception.keyValue[field]}" already exists.`;
    }

    // Handle common framework / parser / database errors that are not HttpException
    else if (typeof exception?.status === 'number') {
      statusCode = exception.status;
      message = exception.message;
    } else if (exception?.name === 'CastError') {
      statusCode = 400;
      message = 'Cast to ObjectId failed';
    } else if (exception?.name === 'ValidationError') {
      statusCode = 400;
      message = 'validation failed';
    } else if (exception instanceof SyntaxError) {
      statusCode = 400;
      message = 'Invalid JSON body';
    }

    const translatedMessage = translateErrorMessage(message, statusCode);
    const logMessage = Array.isArray(translatedMessage)
      ? translatedMessage.join(' | ')
      : translatedMessage;

    if (statusCode >= 500) {
      this.logger.error(
        `HTTP ${statusCode} - ${logMessage} - ${request.method} ${request.url}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `HTTP ${statusCode} - ${logMessage} - ${request.method} ${request.url}`,
      );
    }

    response.status(statusCode).json({
      status: false,
      message: translatedMessage,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
