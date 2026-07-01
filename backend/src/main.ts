// ValidationPipe enables DTO validation globally.
// Example: it validates RegisterDto, CreateProductDto, etc.
import { ValidationPipe } from '@nestjs/common';

// NestFactory creates the Nest.js application.
import { NestFactory } from '@nestjs/core';

// NestExpressApplication gives us Express-specific features.
// We need it for app.useStaticAssets().
import type { NestExpressApplication } from '@nestjs/platform-express';

// cookieParser allows backend to read cookies like refresh_token.
import cookieParser = require('cookie-parser');

// join safely creates file/folder paths.
import { join } from 'path';

// AppModule is the root backend module.
import { AppModule } from './app.module';

// bootstrap starts the backend application.
async function bootstrap() {
  // Create Nest.js app with Express-specific type.
  // This allows us to use app.useStaticAssets().
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable cookie parser.
  // Required for /auth/refresh because refresh token is stored in cookie.
  app.use(cookieParser());

  // Serve uploaded files publicly.
  // process.cwd() inside backend container is /app.
  // So this serves /app/uploads at URL /uploads.
  // Example file:
  // /app/uploads/products/abc.jpg
  // Browser URL:
  // http://localhost:3001/uploads/products/abc.jpg
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS so frontend can call backend.
  app.enableCors({
    // Allow frontend URL from .env.
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',

    // credentials true allows cookies between frontend/backend.
    credentials: true,
  });

  // Enable global validation for DTO classes.
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove fields that are not in DTO.
      whitelist: true,

      // Throw error if user sends extra unknown fields.
      forbidNonWhitelisted: true,

      // Convert string query/body values to correct types where possible.
      transform: true,
    }),
  );

  // Start backend on PORT from .env or 3001.
  // 0.0.0.0 is required inside Docker.
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}

// Run bootstrap function.
bootstrap();