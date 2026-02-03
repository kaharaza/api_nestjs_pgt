import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthService } from 'src/auth.service';
import { EmailService } from 'src/email.service';
import { RateLimit } from 'src/middleware/rate-limit.decorator';
import { AuthGuard } from 'src/service/auth.guard';
import {
  useCheckEmailAdmin,
  useDecodecryptBody,
  useDecodecryptQuery,
} from 'src/utils/useCode';

const prisma = new PrismaClient();

@Controller('api/pgt/sponsor')
export class SponsorController {
  private secretKey: string;
  private secretKeyDashbord: string;
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {
    this.secretKey = process.env.CRYPTO_SECRET_KEY;

    this.secretKeyDashbord = process.env.DASHBOARD_PGT_CRYPTO_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error(
        'CRYPTO_SECRET_KEY ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
    if (!this.secretKeyDashbord) {
      throw new Error(
        'CRYPTO_SECRET_KEY_DASHBOARD ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
  }

  @Post('register')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async register(@Body() body: { encryptedData: string }, @Req() req: Request) {
    let finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    let nowThai = new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      console.log(`[${nowThai}] [Register Sponsor] START | IP: ${finalIp}`);

      const decode = useDecodecryptBody(body, this.secretKeyDashbord);
      const dataDecode = JSON.parse(decode);

      // ตรวจสอบ email admin
      const checkAdmin = await useCheckEmailAdmin(dataDecode.userEmail);
      if (!checkAdmin) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Email ไม่ถูกต้อง',
        };
      }

      // ตรวจสอบว่า codeId เป็น array
      if (!Array.isArray(dataDecode.codeId) || dataDecode.codeId.length === 0) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'codeId ต้องเป็นรายการรหัสผู้ใช้ที่ไม่ว่างเปล่า',
        };
      }

      // ตรวจสอบว่ามีการลงทะเบียนซ้ำหรือไม่ (optional แต่แนะนำ)
      const existingRegs = await prisma.pGT_Project_Registration.findMany({
        where: {
          projectId: dataDecode.projectId,
          userId: { in: dataDecode.codeId },
        },
        select: { userId: true },
      });

      const existingUserIds = new Set(existingRegs.map((r) => r.userId));
      const newUserIds = dataDecode.codeId.filter(
        (id) => !existingUserIds.has(id),
      );

      if (newUserIds.length === 0) {
        return {
          statusCode: HttpStatus.CONFLICT,
          success: false,
          message: 'ผู้ใช้ทั้งหมดได้ลงทะเบียนไปแล้ว',
        };
      }

      // สร้างข้อมูลสำหรับแต่ละ userId
      const registrationData = newUserIds.map((userId) => ({
        projectId: dataDecode.projectId,
        userId: userId, // string เดียวต่อ record
        totalAmount: 0,
        discountAmount: 0,
        pricingTier: 'REGULAR',
        packageName: 'LECTURE',
        paymentStatus: 'PAID',
        transferSlipUrl: '',
        transferSlipStatus: 'APPROVED',
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // ใช้ createMany กับ array ของ object
      const resp = await prisma.pGT_Project_Registration.createMany({
        data: registrationData,
      });

      console.log(
        `[${nowThai}] [Register Sponsor] END | IP: ${finalIp} | จำนวนที่บันทึก: ${resp.count}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: `สมัครสปอนเซอร์สำเร็จ (${resp.count} รายการ)`,
      };
    } catch (error) {
      console.error(`[Register Sponsor] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'เกิดข้อผิดพลาดขณะสมัครสปอนเซอร์',
      };
    }
  }

  @Get('list')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async list(@Query('data') data: string, @Req() req: Request) {
    let finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    let nowThai = new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      console.log(`[${nowThai}] [Fetch List Sponsor] START | IP: ${finalIp}`);
      const decode = useDecodecryptQuery(data, this.secretKeyDashbord);
      const dataDecode = JSON.parse(decode);

      const checkAdmin = await useCheckEmailAdmin(dataDecode.email);
      if (!checkAdmin) {
        throw new Error('Email ไม่ถูกต้อง');
      }

      const resp = await prisma.pGT_Project_Registration.findMany({
        where: {
          projectId: dataDecode.projectId,
          totalAmount: 0,
          paymentStatus: 'PAID',
          transferSlipStatus: 'APPROVED',
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              codeId: true,
              fnameTh: true,
              lnameTh: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!resp) {
        throw new Error('ไม่พบข้อมูล');
      }

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'ดึงรายชื่อสปอนเซอร์สําเร็จ',
        data: resp,
      };
    } catch (error) {
      console.error(`[Fetch List Sponsor] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Internal Server Error',
      };
    }
  }

  @Delete('delete')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async delete(@Query('data') data: string, @Req() req: Request) {
    let finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    let nowThai = new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      const decode = useDecodecryptQuery(data, this.secretKeyDashbord);
      const dataDecode = JSON.parse(decode);

      const checkAdmin = await useCheckEmailAdmin(dataDecode.email);
      if (!checkAdmin) {
        throw new Error('Email ไม่ถูกต้อง');
      }

      console.info(
        `${nowThai} | ${finalIp} | ${req.url} | ${req.method} | ADMIN :, ${JSON.stringify(checkAdmin.name, null, 2)}`,
      );

      const resp = await prisma.pGT_Project_Registration.deleteMany({
        where: {
          projectId: dataDecode.projectId,
          userId: dataDecode.codeId,
        },
      });
      if (!resp) {
        throw new Error('ไม่พบข้อมูล');
      }

      console.info(
        `${nowThai} | ${finalIp} | ${req.url} | ${req.method} | Success `,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Delete Sponsor Success',
      };
    } catch (error) {
      console.error(`[Delete Sponsor] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Internal Server Error',
      };
    }
  }
}
