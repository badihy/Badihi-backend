import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exception-handlers/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ClassSerializerInterceptor, Logger, ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor());
  const logger = new Logger()
  const config = new DocumentBuilder()
    .setTitle('Badihi API')
    .setDescription('Badihi API description')
    .setVersion('1.0')
    .addCookieAuth('token', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      initOAuth: {
        clientId: 'clientId',
        clientSecret: 'clientSecret',
        scopeSeparator: ' ',
        scopes: ['read', 'write', 'admin'],
      }
    },
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  logger.log(`documentation is running on: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
