import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as CryptoJs from 'crypto-js';
import { AuthGuard } from 'src/service/auth.guard';

const prisma = new PrismaClient();

@Controller('api/pgt/data')
export class PGTCheckInController {
  private secretKeyDashboard: string;
  private secretKey: string;
  constructor() {
    this.secretKeyDashboard = process.env.DASHBOARD_PGT_CRYPTO_SECRET_KEY;
    this.secretKey = process.env.CRYPTO_SECRET_KEY;
    if (!this.secretKeyDashboard) {
      throw new Error(
        'CRYPTO_SECRET_KEY_DASHBOARD ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
    if (!this.secretKey) {
      throw new Error(
        'CRYPTO_SECRET_KEY ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
  }

  // New Code
  @Post('check-in')
  // @RateLimit(60, 1)
  @UseGuards(AuthGuard)
  async checkinQrCode(
    @Body() body: { encryptedData: string },
    @Req() req: Request,
  ) {
    let finalIp = req.headers['x-forwarded-for'] || 'unknown';
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    try {
      console.log(`[${nowThai}] [CHECK-IN] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);

      const dataBytesId = CryptoJs.AES.decrypt(dataDecode.data, this.secretKey);
      const decryptedStringId = dataBytesId.toString(CryptoJs.enc.Utf8);

      if (!decryptedStringId) {
        throw new Error('Decryption failed');
      }

      const dataDecodeId = JSON.parse(decryptedStringId);

      const reCheckRegister = await prisma.pGT_Project_Registration.findFirst({
        where: {
          userId: dataDecode.codeId,
          projectId: parseInt(dataDecodeId),
        },
        select: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              codeId: true,
              email: true,
              fnameTh: true,
              lnameTh: true,
            },
          },
        },
      });

      if (!reCheckRegister) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'ไม่พบข้อมูลการลงทะเบียน',
        };
      }

      console.log({
        projectId: reCheckRegister.project.id,
        projectName: reCheckRegister.project.title,
        codeId: reCheckRegister.user.codeId,
        email: reCheckRegister.user.email,
        fnameTh: reCheckRegister.user.fnameTh,
        lnameTh: reCheckRegister.user.lnameTh,
        date: new Date().toLocaleString('th-TH', {
          timeZone: 'Asia/Bangkok',
        }),
      });

      const dayIdTH = (() => {
        const fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const [y, m, d] = fmt.format(new Date()).split('-');
        return `${y}${m}${d}`; // "20260116"
      })();

      const checkin = await prisma.pGT_CheckIn.upsert({
        where: {
          uniq_user_title_per_day_th: {
            userId: dataDecode.codeId,
            titleId: reCheckRegister.project.id,
            dayIdTH,
          },
        },
        update: {
          dateCheckin: new Date(),
          dayIdTH,
        },
        create: {
          userId: dataDecode.codeId,
          titleId: reCheckRegister.project.id,
          dayIdTH,
          dateCheckin: new Date(),
        },
      });

      if (!checkin) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Check-in failed.',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Check-in successful.',
      };
    } catch (error) {
      console.error(`[CHECK-IN] ERROR | ${error?.message ?? error}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message ?? 'Unknown error',
      };
    }
  }
}
