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

dotenv.config();
@Module({
  // Email
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: configService.get<string>('MAILER_EMAIL'),
            pass: configService.get<string>('MAILER_PASSWORD'),
          },
        },
      }),
      inject: [ConfigService],
    }),
    JwtPgtModule,
    
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'filePGT'),
      serveRoot: '/filePGT',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'upload', 'PGT', 'Slip'),
      serveRoot: '/upload/PGT/Slip',
    }),
  ],
  controllers: [
    PGTStaffController,
    PGTUserController,
    PGTProjectController,
    PGTCheckInController,
    SponsorController,
  ],
  providers: [
    EmailService,
    AuthService,
    LineNotifyService,
    LoggerService,
  ],

})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
