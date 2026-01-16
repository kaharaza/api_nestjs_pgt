import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer'; // Email
import { ConfigModule, ConfigService } from '@nestjs/config'; //Email
import { EmailService } from './email.service'; //Email
import { AuthService } from './auth.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { LineNotifyService } from './line.service';
import { JwtPgtModule } from './service/jwt/jwt-pgt.module';
import { PGTStaffController } from './controllers/PGT/staff.controller';
import { LoggerService } from './service/logger/logger.service';
import { IpLoggerMiddleware } from './middleware/ip-logger.middleware';
import { PGTUserController } from './controllers/PGT/user.controller';
import { PGTProjectController } from './controllers/PGT/project.controller';
import { PGTCheckInController } from './controllers/PGT/checkin.controller';
import { SponsorController } from './controllers/PGT/sponsor.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthCMUService } from './auth.cmu.service';
import { AuthController } from './controllers/PGT/auth.controller';

dotenv.config();
@Module({
  // Email
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<string>('MAIL_PORT'),
          secure: false,
          requireTLS: true,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: '"PGT CMU" <no-reply-pgt-cmu@cmu.ac.th>',
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // ค่า default 60 วิ
        limit: 60, // ค่า default 60 req
      },
    ]),

    JwtPgtModule,

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'upload', 'tmp'),
      serveRoot: '/app/upload/tmp',
      exclude: ['/api*'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'upload', 'PGT', 'Slip'),
      serveRoot: '/app/upload/PGT/Slip',
      exclude: ['/api*'],
    }),
  ],
  controllers: [
    PGTStaffController,
    PGTUserController,
    PGTProjectController,
    PGTCheckInController,
    SponsorController,
    AuthController,
  ],
  providers: [
    EmailService,
    AuthService,
    AuthCMUService,
    LineNotifyService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // เปิดใช้ guard ทั่วทั้งแอป
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
