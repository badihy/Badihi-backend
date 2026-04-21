import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exception-handlers/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  BadRequestException,
  Logger,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { translateValidationErrors } from './common/exception-handlers/arabic-error-messages';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.enableShutdownHooks();

  // Exclude deep link routes from global prefix - they need to be at root for App Links to work
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'verify-email', method: RequestMethod.GET },
      { path: 'reset-password', method: RequestMethod.GET },
      { path: '.well-known', method: RequestMethod.GET },
    ],
  });
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: translateValidationErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const logger = new Logger('Bootstrap');
  const config = new DocumentBuilder()
    .setTitle('Badihi API')
    .setDescription('Badihi API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use the refresh token in the Authorization header as Bearer <refresh_token> for GET /auth/refresh.',
        in: 'header',
      },
      'JWT-refresh',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use the access token in the Authorization header as Bearer <access_token>, for example after login.',
        in: 'header',
      },
      'JWT-access',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
  });

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Documentation is running on: http://localhost:${port}/api/docs`);
}
bootstrap();
