import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Req,
  Headers,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/service/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth.service';
import { Request } from 'express';
import { EmailService } from 'src/email.service';
import { AuthGuard } from 'src/service/auth.guard';
import * as CryptoJs from 'crypto-js';
import { RateLimit } from 'src/middleware/rate-limit.decorator';

const prisma = new PrismaClient();

@Controller('api/pgt/user')
export class PGTUserController {
  private secretKey: string;
  private secretPassKey: string;
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {
    this.secretKey = process.env.CRYPTO_SECRET_KEY;
    this.secretPassKey = process.env.RESET_PASS_CRYPTO_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error(
        'CRYPTO_SECRET_KEY ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
    if (!this.secretPassKey) {
      throw new Error(
        'CRYPTO_SECRET_PASS_KEY ไม่ได้ถูกกำหนดใน environment variables',
      );
    }
  }

  @Post('register')
  @RateLimit(60, 10)
  async register(@Body() body: { encryptedData: string }, @Req() req: Request) {
    let finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date();

    try {
      console.log(`[${nowThai}] [Register] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);

      const hashpasword = CryptoJs.SHA256(dataDecode.password).toString(
        CryptoJs.enc.Hex,
      );

      const vetType =
        dataDecode.userType === 'veterinarian'
          ? 'Vet'
          : dataDecode.userType === 'student'
            ? 'Student'
            : dataDecode.userType === 'scientist'
              ? 'Scientist'
              : dataDecode.userType === 'vet_nurse'
                ? 'Vet nurse'
                : dataDecode.userType === 'vet_tech'
                  ? 'Vet tech'
                  : '-';

      if (!hashpasword) {
        throw new Error('Decryption password failed');
      }

      const check_email = await prisma.pGT_User.findFirst({
        where: {
          email: dataDecode.email,
          cecode: dataDecode.licenseNumber,
        },
      });

      if (check_email) {
        throw new Error('Email already exists');
      }

      const randomCodeId = Math.floor(Math.random() * 1000000);
      const nameCode = 'PGT-' + randomCodeId;
      const codeId = 'PGT-' + randomCodeId + '-' + Date.now();

      const res = await prisma.pGT_User.create({
        data: {
          address: dataDecode.address,
          email: dataDecode.email,
          phone: dataDecode.mobile,
          codeId: nameCode,
          county: dataDecode.province,
          district: dataDecode.district,
          ethnicity: dataDecode.ethnicity,
          fnameEn: dataDecode.firstNameEn,
          fnameTh: dataDecode.firstNameTh,
          idCard: codeId,
          lnameEn: dataDecode.lastNameEn,
          lnameTh: dataDecode.lastNameTh,
          foodtype: dataDecode.dietaryPreference,
          nationality: dataDecode.nationality,
          parish: dataDecode.subdistrict,
          pwd: hashpasword,
          prefix: dataDecode.prefixTh,
          role: vetType,
          sex: dataDecode.gender,
          zipcode: dataDecode.postalCode,
          cecode: dataDecode.licenseNumber,
          hdb: '-',
          lineId: dataDecode.lineId ?? '-',
          pdpa: 'Accept',
          schoolEnd: dataDecode.university ?? '-',
          schoolYear: dataDecode.graduationYear ?? '-',
          workaddress: dataDecode.workplace ?? '-',
          worklocaltion: dataDecode.workProvince ?? '-',
          admp: dataDecode.academicTitle ?? '-',
          points: 0,
          certName: dataDecode.firstNameEn + ' ' + dataDecode.lastNameEn,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (!res) {
        throw new Error('Create user failed');
      }

      await this.emailService.sendTemplateEmail(
        res.email,
        'register-success',
        'สมัครสมาชิกศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่ - สำเร็จ',
        {
          fnameTh: res.fnameTh,
          lnameTh: res.lnameTh,
          codeId: res.codeId,
          year: new Date().getFullYear(),
        },
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Create user success',
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

  @Post('login')
  @RateLimit(60, 10)
  async login(@Body() body: { encryptedData: string }, @Req() req: Request) {
    let finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date();
    try {
      console.log(`[${nowThai}] [Login] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);

      const hashpasword = CryptoJs.SHA256(dataDecode.password).toString(
        CryptoJs.enc.Hex,
      );

      const userData = await prisma.pGT_User.findFirst({
        where: {
          email: dataDecode.email,
          pwd: hashpasword,
        },
        select: {
          codeId: true,
          cecode: true,
          email: true,
          fnameEn: true,
          lnameEn: true,
          points: true,
          role: true,
          foodtype: true,
          sex: true,
        },
      });

      if (userData) {
        const token: any = await this.authService.loginPgt(userData);
        console.log(`[${nowThai}] [Login] END | IP: ${finalIp}`);
        return {
          statusCode: HttpStatus.OK,
          success: true,
          token: token,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Email or password invalid',
        };
      }
    } catch (error) {
      console.error(`[Login] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Post('reset-pass')
  @RateLimit(60, 10)
  async signin(@Body() body: { encryptedData: string }, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date();
    try {
      console.log(`[${nowThai}] [Exchange Key] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);

      const userData = await prisma.pGT_User.findFirst({
        where: {
          email: dataDecode,
        },
        select: {
          codeId: true,
          email: true,
          fnameTh: true,
          lnameTh: true,
          id: true,
        },
      });

      if (!userData) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Data not found',
        };
      }

      const redirect_base = process.env.RESET_REDIRECT_URI;
      const codeId = userData.codeId;
      const expiresInMinutes = 30; // minutes
      const now = Date.now();
      const exp = now + expiresInMinutes * 60 * 1000; // ms

      const payload = {
        id: userData.id,
        email: userData.email,
        codeId: codeId,
        exp: exp,
      };

      const dataPassEncode = CryptoJs.AES.encrypt(
        JSON.stringify(payload),
        this.secretPassKey,
      ).toString();

      const redirect_url = `${redirect_base}?key=${encodeURIComponent(dataPassEncode)}`;

      await this.emailService.sendTemplateEmail(
        userData.email,
        'reset-password',
        'รีเซ็ตรหัสผ่าน - ศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่',
        {
          fnameTh: userData.fnameTh,
          lnameTh: userData.lnameTh,
          redirect: redirect_url,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Send email success',
      };
    } catch (error) {
      console.error(`[Login] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Post('new-pass')
  @RateLimit(60, 10)
  async newpass(@Body() body: { encryptedData: string }, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date();
    try {
      console.log(`[${nowThai}] [Exchange Key] START | IP: ${finalIp}`);

      const dataBytes = CryptoJs.AES.decrypt(
        body.encryptedData,
        this.secretKey,
      );
      const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed');
      }

      const dataDecode = JSON.parse(decryptedString);

      const hashpasword = CryptoJs.SHA256(dataDecode.password).toString(
        CryptoJs.enc.Hex,
      );

      const userData = await prisma.pGT_User.findFirst({
        where: {
          id: dataDecode.id,
          codeId: dataDecode.codeId,
          email: dataDecode.email,
        },
        select: {
          codeId: true,
          email: true,
          fnameTh: true,
          lnameTh: true,
          id: true,
        },
      });

      if (!userData) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Data not found',
        };
      }

      const update = await prisma.pGT_User.update({
        where: {
          id: userData.id,
          email: userData.email,
          codeId: userData.codeId,
        },
        data: {
          pwd: hashpasword, //: dataDecode.codeId,
        },
      });

      if (update) {
        return {
          statusCode: HttpStatus.OK,
          success: true,
          message: 'Update success',
        };
      }
    } catch (error) {
      console.error(`[Login] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Get('profile')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async profile(@Query('data') data: string, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    try {
      console.log(`[${nowThai}] [Profile] START | IP: ${finalIp}`);

      if (!data) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Missing data parameter',
        };
      }

      const cipherText = decodeURIComponent(data);

      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKey);
      const decryptedString = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Decryption failed',
        };
      }

      const dataDecode = JSON.parse(decryptedString);

      const userData = await prisma.pGT_User.findFirst({
        where: {
          codeId: dataDecode.codeId,
          id: dataDecode.id,
        },
        select: {
          id: true,
          email: true,
          fnameTh: true,
          lnameTh: true,
          codeId: true,
          fnameEn: true,
          lnameEn: true,
          ethnicity: true,
          county: true,
          zipcode: true,
          prefix: true,
          nationality: true,
          sex: true,
          idCard: true,
          address: true,
          parish: true,
          district: true,
          schoolEnd: true,
          schoolYear: true,
          workaddress: true,
          worklocaltion: true,
          phone: true,
          lineId: true,
          certName: true,
          cecode: true,
          admp: true,
          foodtype: true,
          pdpa: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!userData) throw new Error('User not found');

      console.log(`[${nowThai}] [Profile] END | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message:
          'The request was successful and the server has returned the requested data',
        results: userData,
      };
    } catch (error) {
      console.error(`[Profile] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }

  @Put('profile/edit')
  @RateLimit(60, 10)
  @UseGuards(AuthGuard)
  async edit(@Query('data') data: string, @Req() req: Request) {
    const finalIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const nowThai = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    try {
      console.log(`[${nowThai}] [Profile Edit] START | IP: ${finalIp}`);

      if (!data) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Missing data parameter',
        };
      }

      console.debug(data);

      const cipherText = decodeURIComponent(data);
      const bytes = CryptoJs.AES.decrypt(cipherText, this.secretKey);
      const decryptedString = bytes.toString(CryptoJs.enc.Utf8);

      if (!decryptedString) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Decryption failed',
        };
      }

      const dataDecode = JSON.parse(decryptedString);

      if (!dataDecode) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Missing codeId parameter',
        };
      }

      const res = await prisma.pGT_User.update({
        where: {
          id: dataDecode.id,
          codeId: dataDecode.codeId,
        },
        data: {
          fnameTh: dataDecode.fnameTh,
          lnameTh: dataDecode.lnameTh,
          ethnicity: dataDecode.ethnicity,
          county: dataDecode.county,
          zipcode: dataDecode.zipcode,
          prefix: dataDecode.prefix,
          nationality: dataDecode.nationality,
          sex: dataDecode.sex,
          address: dataDecode.address,
          parish: dataDecode.parish,
          district: dataDecode.district,
          schoolEnd: dataDecode.schoolEnd,
          schoolYear: dataDecode.schoolYear,
          workaddress: dataDecode.workaddress,
          worklocaltion: dataDecode.worklocaltion,
          lineId: dataDecode.lineId,
          certName: dataDecode.certName,
          cecode: dataDecode.cecode,
          admp: dataDecode.admp,
          updatedAt: new Date(),
        },
      });

      if (!res) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Update failed',
        };
      }

      console.log(`[${nowThai}] [Profile Edit] END | IP: ${finalIp}`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Edit profile successfully',
      };
    } catch (error) {
      console.error(`[Profile Edit] ERROR | ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
      };
    }
  }
}
