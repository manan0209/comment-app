import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.use(helmet());
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://frontend:3000',
      'https://commentapp-frontend-production.railway.app',
      /\.railway\.app$/,  // Allow any Railway app domain
      /\.onrender\.com$/  // Allow any Render app domain
    ],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
