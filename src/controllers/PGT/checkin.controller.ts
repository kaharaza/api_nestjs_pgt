import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as CryptoJs from 'crypto-js';
import { AuthGuard } from 'src/service/auth.guard';
import { useCheckEmailAdmin } from 'src/utils/useCode';
import { WsService } from 'src/ws/pgt-ws.service';

const prisma = new PrismaClient();

@Controller('api/pgt/data')
export class PGTCheckInController {
  private secretKeyDashboard: string;
  private secretKey: string;
  constructor(private readonly ws: WsService) {
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
      console.info(
        `[${nowThai}] |IP: ${finalIp}| ${req.method} | ${req.url} | [CHECK-IN] START`,
      );

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

      this.ws.emit('checkin.updated', {
        projectId: reCheckRegister.project.id,
        userId: dataDecode.codeId,
        titleId: reCheckRegister.project.id,
        dayIdTH,
        dateCheckin: new Date().toISOString(),
      });

      const payload = {
        projectName: reCheckRegister.project.title,
        name: reCheckRegister.user.fnameTh + ' ' + reCheckRegister.user.lnameTh,
      };

      console.info(
        `[${nowThai}] |IP: ${finalIp}| ${req.method} | ${req.url} | [CHECK-IN] SUCCESS | ${JSON.stringify(payload, null, 2)}`,
      );

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

  @Get('list/checkin')
  @UseGuards(AuthGuard)
  async listCheckin(@Query('data') data: string, @Req() req: Request) {
    const finalIp = req.headers['x-forwarded-for'] || 'unknown';
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKey);
      const decryptedString = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error(
          'Decrypt failed: empty plaintext. Check secret or encoding.',
        );
      }

      const decodeData = JSON.parse(decryptedString);

      // 1. ดึงวันที่ปัจจุบันใน Timezone ไทย
      const now = new Date();
      const thaiDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now); // ผลลัพธ์จะเป็น "2026-01-29"

      // 2. แปลง "2026-01-29" -> "20260129"
      const currentDayIdTH = thaiDate.replace(/-/g, '');

      const resp = await prisma.pGT_CheckIn.findMany({
        where: {
          dayIdTH: currentDayIdTH,
          titleId: parseInt(decodeData),
        },
        orderBy: {
          dateCheckin: 'desc',
        },
        select: {
          dateCheckin: true,
          pgt_user: {
            select: {
              fnameTh: true,
              lnameTh: true,
            },
          },
        },
      });

      if (!resp) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Request not found.',
          results: [],
        };
      }
      console.info(
        `[${nowThai}] |IP: ${finalIp}| ${req.method} | ${req.url} | [LIST CHECK-IN] SUCCESS}`,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: resp ?? [],
      };
    } catch (error) {
      console.error(`[LIST CHECK-IN] ERROR | ${error?.message ?? error}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message ?? 'Unknown error',
      };
    }
  }

  @Get('list/checkin/summary')
  @UseGuards(AuthGuard)
  async listCheckinSummary(@Query('data') data: string, @Req() req: Request) {
    const finalIp = req.headers['x-forwarded-for'] || 'unknown';
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKeyDashboard);
      const decryptedString = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error(
          'Decrypt failed: empty plaintext. Check secret or encoding.',
        );
      }

      const decodeData = JSON.parse(decryptedString);
      const checkEmail = await useCheckEmailAdmin(decodeData.email);

      if (!checkEmail) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Request not found.',
          results: [],
        };
      }

      const resp = await prisma.pGT_CheckIn.findMany({
        where: {
          titleId: decodeData.projectId,
        },
        select: {
          dateCheckin: true,
          pgt_user: {
            select: {
              fnameTh: true,
              lnameTh: true,
              cecode: true,
              codeId: true,
            },
          },
        },
      });

      // จัดกลุ่มข้อมูลตามชื่อผู้ใช้
      const groupedData = resp.reduce((acc, item) => {
        const userKey = `${item.pgt_user.codeId}`; // ใช้ codeId เป็นคีย์สำหรับจัดกลุ่ม

        if (!acc[userKey]) {
          acc[userKey] = {
            fnameTh: item.pgt_user.fnameTh,
            lnameTh: item.pgt_user.lnameTh,
            cecode: item.pgt_user.cecode,
            codeId: item.pgt_user.codeId,
            dateCheckins: [],
          };
        }

        acc[userKey].dateCheckins.push(item.dateCheckin);

        return acc;
      }, {});

      // แปลงเป็นอาเรย์
      const results = Object.values(groupedData);

      console.info(
        `[${nowThai}] |IP: ${finalIp}| ${req.method} | ${req.url} | [LIST CHECK-IN SUMMARY] SUCCESS}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Success',
        results,
      };
    } catch (error) {
      console.error(
        `[LIST CHECK-IN SUMMARY] ERROR | ${error?.message ?? error}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message ?? 'Unknown error',
      };
    }
  }
}
