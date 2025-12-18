import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // ใช้ req.ip ซึ่งจะถูกต้องหลังตั้ง trust proxy
    let clientIp = req.ip || req.connection.remoteAddress;

    // จัดการ IPv4-mapped IPv6 (เช่น ::ffff:127.0.0.1)
    if (clientIp?.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    // หรือถ้าต้องการ log แบบละเอียด (chain ของ proxy)
    // const ips = req.ips; // array ของ proxy chain

    this.logger.log(`Client IP: ${clientIp}`);
    next();
  }
}