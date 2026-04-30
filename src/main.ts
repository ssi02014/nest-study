import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // playground.html 에서 접근 가능하도록 설정
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
