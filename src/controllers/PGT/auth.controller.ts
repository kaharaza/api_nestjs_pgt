import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthCMUService } from 'src/auth.cmu.service';
import { AuthService } from 'src/auth.service';

const prisma = new PrismaClient();

interface DataAccount {
  cmuitaccount: string;
  cmuitaccount_name: string;
  firstname_EN: string;
  firstname_TH: string;
  itaccounttype_EN: string;
  itaccounttype_TH: string;
  itaccounttype_id: string;
  lastname_EN: string;
  lastname_TH: string;
  organization_code: string;
  organization_name_EN: string;
  organization_name_TH: string;
  prename_EN: string;
  prename_TH: string;
  prename_id: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthCMUService,
    private readonly jwtAuthService: AuthService,
  ) {}

  @Post('exchange-code-admin')
  async exchangeCodeAdmin(@Body('code') code: string) {
    try {
      const accessToken = await this.authService.exchangeCodeForToken(code);
      return { accessToken };
    } catch (e) {
      throw new HttpException(
        'Error exchanging code for token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('add/account')
  async add(@Body() body: DataAccount) {
    try {
      if (!['14'].includes(body.organization_code)) {
        return {
          success: false,
          respCode: HttpStatus.FORBIDDEN,
          message: 'ท่านไม่มีสิทธิ์เข้าใช้งานระบบนี้',
        };
      }

      if (!body.cmuitaccount || !body.cmuitaccount_name) {
        throw new HttpException(
          'Missing cmuitaccount or cmuitaccount_name',
          HttpStatus.BAD_REQUEST,
        );
      }

      let existingUser = await prisma.cmuItAccount.findFirst({
        where: { email: body.cmuitaccount },
      });

      // 4. ถ้าไม่มี → สร้างใหม่ (ตั้ง permission เริ่มต้น)
      if (!existingUser) {
        existingUser = await prisma.cmuItAccount.create({
          data: {
            name: body.firstname_TH + ' ' + body.lastname_TH,
            email: body.cmuitaccount,
            role: 'USER',
            permissions: ['READ'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // 5. ถ้ามี → อัปเดต token
        existingUser = await prisma.cmuItAccount.update({
          where: { email: body.cmuitaccount },
          data: {
            updatedAt: new Date(),
          },
        });
      }

      // 6. เตรียมข้อมูลสำหรับสร้าง JWT
      const jwtPayload = {
        id: existingUser.id,
        cmuitaccount: existingUser.email,
        name: existingUser.name,
        organization_code: body.organization_code,
        itaccounttype_id: body.itaccounttype_id,
        role: existingUser.role,
        permission: existingUser.permissions, // ✅ ดึงจาก DB เท่านั้น
      };

      // 7. สร้าง token
      const token = await this.jwtAuthService.loginAdminPgt(jwtPayload);

      return {
        success: true,
        respCode: existingUser ? HttpStatus.OK : HttpStatus.CREATED,
        message: existingUser ? 'Token updated' : 'Create New Account',
        token,
      };
    } catch (e) {
      console.error('Add account error:', e);
      throw new HttpException(
        'Error creating or updating user account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
