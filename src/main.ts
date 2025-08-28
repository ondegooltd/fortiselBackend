import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:8081', // Expo/React Native frontend
      'http://localhost:19006', // Expo web (alternative)
      'http://localhost:3000', // (optional) web frontend or Swagger
      'http://192.168.124.81:8081', // If you access from your phone's browser
      'http://192.168.124.81:19006', // If you access from your phone's browser
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Fortisel API')
    .setDescription('API documentation for the Fortisel LPG backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
