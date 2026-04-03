import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/exception-handlers/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedServer: any;

async function bootstrapServer() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn', 'log'] });

  // Keep the same runtime behavior as src/main.ts
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'verify-email', method: RequestMethod.GET },
      { path: 'reset-password', method: RequestMethod.GET },
      { path: '.well-known', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  cachedServer = cachedServer ?? (await bootstrapServer());
  return cachedServer(req, res);
}

