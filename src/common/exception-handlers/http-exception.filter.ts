import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    Logger,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HttpExceptionFilter');

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let statusCode = 500;
        let message = 'Internal server error';

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
            message = `Duplicate value for "${field}": "${exception.keyValue[field]}" already exists.`;
        }

        // Optional: Handle other Mongoose errors here

        this.logger.error(
            `HTTP ${statusCode} - ${message} - ${request.method} ${request.url}`,
            exception.stack,
        );

        response.status(statusCode).json({
            status: false,
            message,
        });
    }
}
