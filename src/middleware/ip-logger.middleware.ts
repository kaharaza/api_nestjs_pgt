import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    let clientIp: string | undefined;

    // 1. ดึงจาก X-Forwarded-For (กรณีอยู่หลัง Proxy / Nginx / Docker)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      // เอา IP ตัวแรก (client จริง)
      clientIp = xForwardedFor.split(',')[0].trim();
    }

    // 2. fallback ใช้ req.ip (Express จะ handle IPv6 / trust proxy)
    if (!clientIp) {
      clientIp = req.ip;
    }

    // 3. fallback สุดท้าย
    if (!clientIp) {
      clientIp = req.socket?.remoteAddress;
    }

    // 4. แปลง IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (clientIp?.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    this.logger.log(`Client IP: ${clientIp}`);
    next();
  }
}
