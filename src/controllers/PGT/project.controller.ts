import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthGuard } from 'src/service/auth.guard';
import { Request } from 'express';
import { LoggerService } from 'src/service/logger/logger.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import * as path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';

import { EmailService } from 'src/email.service';
import { LineNotifyService } from 'src/line.service';
import { RateLimit } from 'src/middleware/rate-limit.decorator';
import * as CryptoJs from 'crypto-js';

import { useCheckEmailAdmin, useDecodecryptQuery } from 'src/utils/useCode';

const prisma = new PrismaClient();

const currentTimeTh = new Date().toLocaleString('th-TH', {
  timeZone: 'Asia/Bangkok',
  numberingSystem: 'latn',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

@Controller('api/pgt/project')
export class PGTProjectController {
  private secretKeyDashboard: string;
  private secretKey: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {
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

  @Post('manage')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async createdProject(
    @Body() body: { encryptedData: string },
    @Req() req: Request,
  ) {
    let finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      console.log(`[${nowThai}] [Register] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKeyDashboard,
      );
      const decryptedData = dataBytes.toString(CryptoJs.enc.Utf8);
      const projectData = JSON.parse(decryptedData);

      if (!projectData.email) {
        throw new Error('Email is required');
      }
      if (!projectData.data) {
        throw new Error('Data is required');
      }

      // 2) Helper converters
      const toInt = (v: unknown, field = 'number') => {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error(`Invalid ${field}: ${v}`);
        return Math.trunc(n);
      };

      const toDate = (v: unknown, field = 'date') => {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime()))
          throw new Error(`Invalid ${field}: ${v}`);
        return d;
      };

      const toStr = (v: unknown, field = 'string') => {
        const s = String(v ?? '').trim();
        if (!s) throw new Error(`Invalid ${field}`);
        return s;
      };

      // 3) Validate base fields
      const id = toInt(projectData.data.id ?? 0, 'id');
      const title = toStr(projectData.data.title, 'title');
      const subtitle = toStr(projectData.data.subtitle, 'subtitle');
      const detail = toStr(projectData.data.detail, 'detail');
      const image = toStr(projectData.data.image, 'image');
      const open_regi = toDate(projectData.data.open_regi, 'open_regi');
      const close_regi = toDate(projectData.data.close_regi, 'close_regi');

      if (close_regi <= open_regi) {
        throw new Error('วันปิดรับสมัครต้องหลังวันเปิดรับสมัคร');
      }

      // 4) Validate activities
      const activitiesRaw = projectData.data.activities;
      if (!Array.isArray(activitiesRaw) || activitiesRaw.length === 0) {
        throw new Error('activities is required (at least 1 activity)');
      }

      const allowedTypes = new Set(['LECTURE', 'LAB', 'WORKSHOP']);
      const seenType = new Set<string>();

      const activities = activitiesRaw.map((a: any, idx: number) => {
        const type = String(a?.type ?? '')
          .trim()
          .toUpperCase();

        if (!allowedTypes.has(type)) {
          throw new Error(`Invalid activity type at index ${idx}: ${a?.type}`);
        }
        if (seenType.has(type)) {
          throw new Error(`Duplicate activity type not allowed: ${type}`);
        }
        seenType.add(type);

        const capacity = toInt(a?.capacity, `activities[${idx}].capacity`);
        const earlyPrice = toInt(
          a?.earlyPrice,
          `activities[${idx}].earlyPrice`,
        );
        const regularPrice = toInt(
          a?.regularPrice,
          `activities[${idx}].regularPrice`,
        );

        if (capacity <= 0)
          throw new Error(`capacity must be > 0 at index ${idx}`);
        if (earlyPrice < 0)
          throw new Error(`earlyPrice must be >= 0 at index ${idx}`);
        if (regularPrice < 0)
          throw new Error(`regularPrice must be >= 0 at index ${idx}`);

        // optional: early <= regular (แนะนำ)
        if (earlyPrice > regularPrice) {
          throw new Error(`earlyPrice must be <= regularPrice at index ${idx}`);
        }

        return { type, capacity, earlyPrice, regularPrice };
      });

      // 5) Upsert Project + Replace Activities in a Transaction
      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.pGT_Register_Project.upsert({
          where: { id: id || 0 },
          update: {
            title,
            subtitle,
            detail,
            image,
            open_regi,
            close_regi,
            updatedAt: new Date(),
          },
          create: {
            title,
            subtitle,
            detail,
            image,
            count_regi: 0,
            price_regi: 0,
            discount: '0',
            open_regi,
            close_regi,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // ลบทิ้งแล้วสร้างใหม่ (ง่ายและกันปัญหา unique)
        await tx.pGT_Project_Activity.deleteMany({
          where: { projectId: project.id },
        });

        await tx.pGT_Project_Activity.createMany({
          data: activities.map((a: any) => ({
            projectId: project.id,
            type: a.type, // ต้องตรง enum ใน Prisma
            capacity: a.capacity,
            earlyPrice: a.earlyPrice,
            regularPrice: a.regularPrice,
          })),
        });
      });

      console.log(`[${nowThai}] [Register] SUCCESS | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
      };
    } catch (error) {
      console.error(`[Register] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Delete('manage/delete')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async deleteProject(@Query('data') data: string, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      LoggerService.log(`[${nowThai}] [Delete Project] START | IP: ${finalIp}`);

      if (!data) {
        throw new Error('Missing query param: data');
      }

      // 1) decrypt email
      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKeyDashboard);
      const decryptedData = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedData) {
        throw new Error(
          'Decrypt failed: empty plaintext. Check secret or encoding.',
        );
      }

      const dataDecode = JSON.parse(decryptedData);

      if (!dataDecode.email) {
        throw new Error('Email is required');
      }
      if (!Number(dataDecode.id)) {
        throw new Error('ID is required');
      }

      // 2) check email
      const user = await prisma.cmuItAccount.findUnique({
        where: { email: dataDecode.email },
      });
      if (!user) {
        throw new Error('User not found');
      }

      // 2) delete activities
      const activities = await prisma.pGT_Project_Activity.deleteMany({
        where: { projectId: Number(dataDecode.id) },
      });

      if (!activities) {
        throw new Error('Activities not found');
      }

      // 3) delete project
      await prisma.pGT_Register_Project.delete({
        where: { id: Number(dataDecode.id) },
      });

      LoggerService.log(
        `[${nowThai}] [Delete Project] SUCCESS | IP: ${finalIp} | User: ${user.email} | ID: ${dataDecode.id}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
      };
    } catch (error) {
      console.error(`[Delete Project] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Get('manage/list')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async listProjects(@Query('data') data: string, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      console.info(
        `[${nowThai}] [  Project Manage List] START | IP: ${finalIp}`,
      );

      if (!data) {
        throw new Error('Missing query param: data');
      }

      // 1) decrypt email
      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKeyDashboard);
      const decryptedEmail = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedEmail) {
        throw new Error(
          'Decrypt failed: empty plaintext. Check secret or encoding.',
        );
      }

      const email = decryptedEmail.trim();
      if (!email) {
        throw new Error('Email is required');
      }

      // 2) check email in account table
      const check_email = await prisma.cmuItAccount.findFirst({
        where: { email },
        select: { email: true },
      });

      if (!check_email) {
        throw new Error('Email not found');
      }

      // 3) fetch projects + include activities
      const res = await prisma.pGT_Register_Project.findMany({
        include: {
          pgtProjectRegistrations: true,
          pgtProjectActivities: true,
        },

        orderBy: { close_regi: 'desc' },
      } as any);

      console.log(
        `[${nowThai}] [Project Manage List] SUCCESS | IP: ${finalIp}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: res ?? [],
      };
    } catch (e) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Get('manage/list/sponser')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async listProjectsSponser(@Query('data') data: string, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      // 1) decrypt email
      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKeyDashboard);
      const decryptedEmail = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedEmail) {
        throw new Error(
          'Decrypt failed: empty plaintext. Check secret or encoding.',
        );
      }

      const email = decryptedEmail.trim();
      if (!email) {
        throw new Error('Email is required');
      }
      console.log(`[${nowThai}] [Project Sponser List] START | IP: ${finalIp}`);
      // 2) check email in account table
      const check_email = await prisma.cmuItAccount.findFirst({
        where: { email },
        select: { email: true },
      });

      if (!check_email) {
        throw new Error('Email not found');
      }

      // 3) fetch projects + include activities
      const res = await prisma.pGT_Register_Project.findMany({
        select: {
          close_regi: true,
          id: true,
          open_regi: true,
          title: true,
          image: true,
        },
        orderBy: { close_regi: 'desc' },
      });

      console.log(
        `[${nowThai}] [Project Sponser List] SUCCESS | IP: ${finalIp}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: res ?? [],
      };
    } catch (e) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Post('register')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const TMP_DIR = path.join(process.cwd(), 'upload', 'tmp');
          fs.mkdirSync(TMP_DIR, { recursive: true });
          cb(null, TMP_DIR);
        },
        filename: (req, file, cb) => {
          // ตั้งชื่อไฟล์ใหม่ให้ไม่ชนกัน + ปลอดภัยขึ้น
          const ext = path.extname(file.originalname || '').toLowerCase();
          const name = path.basename(file.originalname || '').replace(ext, '');
          const unique = `${name}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
          cb(null, `${unique}${ext}`);
        },
      }),

      // จำกัดขนาดไฟล์ (ปรับได้)
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      // filter ประเภทไฟล์ (ปรับตามที่ต้องการ)
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Invalid file type'), false);
      },
    }),
  )
  async registerProject(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { encryptedData: string },
    @Req() req: Request,
  ) {
    const FINAL_DIR = path.join(process.cwd(), 'upload', 'PGT', 'Slip');
    try {
      const finalIp =
        (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const nowThai = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
      });

      console.log(`[${nowThai}] [Register Project] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);
      const decodedData = JSON.parse(dataDecode);

      // check codeId
      const checkCodeId = await prisma.pGT_User.findFirst({
        where: {
          codeId: decodedData.userId,
        },
        select: {
          codeId: true,
          email: true,
          fnameTh: true,
          lnameTh: true,
          phone: true,
        },
      });

      // check codeId ไม่ถูกต้อง
      if (!checkCodeId) {
        throw new Error('codeId not found');
      }

      const reCheckRegister = await prisma.pGT_Project_Registration.findFirst({
        where: {
          userId: decodedData.userId,
          projectId: Number(decodedData.projectId),
        },
      });

      if (reCheckRegister) {
        console.log(
          `[${nowThai}] [Register Project] You have already registered for this project | IP: ${finalIp}`,
        );
        throw new Error('You have already registered for this project');
      }

      const res = await prisma.pGT_Project_Registration.create({
        data: {
          projectId: Number(decodedData.projectId),
          userId: decodedData.userId,
          totalAmount: Number(decodedData.price),
          discountAmount: 0,
          pricingTier: decodedData.pricingTier,
          packageName: decodedData.activityType,
          paymentStatus: 'PENDING',
          transferSlipUrl: file?.filename,
          transferSlipStatus: 'APPROVED',
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          cancelledAt: null,
        },
      });

      const title = await prisma.pGT_Register_Project.findFirst({
        where: {
          id: Number(decodedData.projectId),
        },
        select: {
          title: true,
        },
      });

      // file จะมีข้อมูลไฟล์ที่ถูกเซฟแล้ว (diskStorage)
      // console.debug('file:', {
      //   originalname: file?.originalname,
      //   mimetype: file?.mimetype,
      //   size: file?.size,
      //   path: file?.path,
      //   file: file,
      //   destination: file?.destination,
      // });

      if (!res) {
        throw new Error('Register project failed');
      }

      // 2) ค่อยย้ายไฟล์ไปโฟลเดอร์จริง
      fs.mkdirSync(FINAL_DIR, { recursive: true });
      const finalPath = path.join(FINAL_DIR, file.filename);
      await fsp.rename(file.path, finalPath);

      // 3) ส่งอีเมลยืนยันการลงทะเบียน สําหรับผู้ลงทะเบียน
      await this.emailService.sendTemplateEmail(
        checkCodeId.email,
        'confirm-register',
        'สมัครเข้าร่วมโครงการสัมมนา ศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่',
        {
          fnameTh: checkCodeId.fnameTh,
          lnameTh: checkCodeId.lnameTh,
          codeId: checkCodeId.codeId,
          email: checkCodeId.email,
          projectName: title?.title,
          year: new Date().getFullYear(),
        },
      );

      // 4) ส่งอีเมลยืนยันการลงทะเบียน สําหรับผู้ดูแล
      const recipients = [
        process.env.EMAIL_STAFF_FIN,
        process.env.EMAIL_STAFF_ADMIN,
      ].filter((x): x is string => Boolean(x));

      await this.emailService.sendTemplateEmailAdmin(
        recipients,
        'alert-to-admin',
        'มีผู้ลงทะเบียนใหม่ Postgraduate Education Center โปรดตรวจสอบ',
        {
          fnameTh: checkCodeId.fnameTh,
          lnameTh: checkCodeId.lnameTh,
          codeId: checkCodeId.codeId,
          email: checkCodeId.email,
          phone: checkCodeId.phone,
          typeRegister: res.packageName,
          pricingTier: res.pricingTier,
          price: res.totalAmount,
          projectName: title?.title,
          dateRegister: res.createdAt.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          }),
          year: new Date().getFullYear(),
        },
      );

      console.log(`[${nowThai}] [Register Project] END | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.OK,
        message: 'Register project successfully',
        success: true,
      };
    } catch (e) {
      // ล้มเหลว → ลบ temp
      if (file?.path) {
        try {
          await fsp.unlink(file.path);
          LoggerService.log(`Delete temp file: ${file.path}`);
        } catch {
          // ignore
        }
      }
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: {
          messageCode: 'INTERNAL_SERVER_ERROR',
          mgs: e.message,
        },
      };
    }
  }

  @Get('list')
  @RateLimit(60, 10)
  async list(@Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      const res = await prisma.pGT_Register_Project.findMany({
        include: {
          pgtProjectRegistrations: true,
          pgtProjectActivities: true,
        },
        orderBy: { close_regi: 'desc' },
      } as any);

      console.log(
        `[${nowThai}] | IP: ${finalIp} | ${req.method} |  [Project List] SUCCESS `,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: res ?? [],
      };
    } catch (e) {
      console.log(`[${nowThai}] [Project List] FAILED | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Get('user')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async userProject(@Query('data') data: string, @Req() req: Request) {
    const finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      numberingSystem: 'latn',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      // 1) decrypt email
      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKey);
      const decryptedData = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedData) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedData);

      const res = await prisma.pGT_User.findFirst({
        where: { email: dataDecode.email, codeId: dataDecode.codeId },

        select: {
          codeId: true,
          pdpa: true,
          pgtProjectRegistrations: {
            select: {
              id: true,
              totalAmount: true,
              pricingTier: true,
              paymentStatus: true,
              transferSlipUrl: true,
              transferSlipStatus: true,
              createdAt: true,
              project: {
                select: {
                  id: true,
                  title: true,
                  open_regi: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!res) {
        throw new Error('User not found');
      }

      console.log(`[${nowThai}] [User Project] SUCCESS | IP: ${finalIp}`);
      console.info();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: res ?? [],
      };
    } catch (error) {
      console.log(`[${nowThai}] [User Project] FAILED | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Get('user/register')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async userRegisterProject(@Query('data') data: string, @Req() req: Request) {
    let finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    let nowThai = new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      numberingSystem: 'latn',
    });
    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      const decode = useDecodecryptQuery(data, this.secretKeyDashboard);
      const dataDecode = JSON.parse(decode);

      const checkAdmin = await useCheckEmailAdmin(dataDecode.email);
      if (!checkAdmin) {
        throw new Error('Email ไม่ถูกต้อง');
      }

      const resp = await prisma.pGT_Project_Registration.findMany({
        where: {
          projectId: dataDecode.projectId,
          transferSlipStatus: 'APPROVED',
        },
        select: {
          userId: true,
          totalAmount: true,
          packageName: true,
          pricingTier: true,
          paymentStatus: true,
          transferSlipStatus: true,
          transferSlipUrl: true,
          createdAt: true,
          user: {
            select: {
              fnameTh: true,
              lnameTh: true,
              email: true,
              phone: true,
              address: true,
              district: true,
              county: true,
              ethnicity: true,
              zipcode: true,
              parish: true,
              certName: true,
              foodtype: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.info(
        `${nowThai} | ${finalIp} | ${req.url} | ${req.method} | [User Register Project] SUCCESS`,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: resp ?? [],
      };
    } catch (error) {
      console.log(
        `[${nowThai}] [User Register Project] FAILED | IP: ${finalIp}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Put('admin/approve-slip')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async approveSlipProject(@Query('data') data: string, @Req() req: Request) {
    let finalIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    let nowThai = currentTimeTh;
    try {
      if (!data) {
        throw new Error('Missing query param: data');
      }

      const decode = useDecodecryptQuery(data, this.secretKeyDashboard);
      const dataDecode = JSON.parse(decode);

      const checkAdmin = await useCheckEmailAdmin(dataDecode.email);
      if (!checkAdmin) {
        throw new Error('Email ไม่ถูกต้อง');
      }

      const resp = await prisma.pGT_Project_Registration.updateMany({
        where: {
          userId: dataDecode.codeId,
          projectId: dataDecode.projectId,
          paymentStatus: dataDecode.patmentStatus,
        },
        data: {
          paymentStatus:
            dataDecode.transferStatus === true ? 'PAID' : 'PENDING',
          updatedAt: new Date(),
        },
      });

      if (!resp) {
        throw new Error('ไม่พบข้อมูล');
      }

      console.info(
        `${nowThai} | ${finalIp} | ${req.url} | ${req.method} | [Approve Slip Project] SUCCESS`,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Update slip status successfully',
      };
    } catch (error) {
      console.log(
        `${nowThai} | ${finalIp} | ${req.url} | ${req.method} | [Approve Slip Project] FAILED`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }
}
