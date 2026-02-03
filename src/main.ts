import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      // origin: ['http://localhost:5173', 'http://localhost:5250'],
      origin: true,
      methods: 'GET,POST,PUT,DELETE,OPTIONS',
    });

    app.useWebSocketAdapter(new IoAdapter(app));

    await app.listen(process.env.PORT || 3000);
    const getThaiTime = () => {
      const now = new Date();
      return now.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };
    console.log(
      `Application is running on: ${getThaiTime()} PORT: ${process.env.PORT || 3000}`,
    );
  } catch (error) {
    console.error('Error starting the application:', error);
  }
}
bootstrap();
