import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {
    dotenv.config();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const secret = process.env.JWT_SECRET_KEY || 'default_secret';

    if (request.headers.authorization) {
      const token = request.headers.authorization.replace('Bearer ', '');

      try {
        const verify = jwt.verify(token, secret);
        if (verify !== null) {
          return true;
        }
      } catch (e) {
        // Log error and IP address
        throw new UnauthorizedException('Authorization failed');
      }
    } else {
      // Log error and IP address
      throw new UnauthorizedException('Authorization failed');
    }

    // Throw error if method not implemented
    throw new Error('Method not implemented.');
  }
}
