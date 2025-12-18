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
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/service/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth.service';
import { Request } from 'express';
import { EmailService } from 'src/email.service';
import { AuthGuard } from 'src/service/auth.guard';

const prisma = new PrismaClient();

interface DataUser {
  email: string;
  idCard: string;
  pwd: string;
}

@Controller('api/pgt/user')
export class PGTUserController {
  constructor(
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post('register')
  async register(
    @Req() req: Request,
    @Body()
    user: {
      data: any;
      hdb: string;
      pwd: string;
      pdpa: string;
      role: string;
      codeId: string;
    },
  ) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const res = await prisma.pGT_User.create({
        data: {
          email: user.data.email,
          fnameTh: user.data.fnameTh,
          fnameEn: user.data.fnameEn,
          lnameTh: user.data.lnameTh,
          lnameEn: user.data.lnameEn,
          ethnicity: user.data.ethnicity,
          county: user.data.county,
          zipcode: user.data.zipcode,
          prefix: user.data.prefix,
          nationality: user.data.nationality,
          sex: user.data.sex,
          idCard: user.data.idCard,
          address: user.data.address,
          parish: user.data.parish,
          district: user.data.district,
          schoolEnd: user.data.schoolEnd,
          schoolYear: user.data.schoolYear,
          worklocaltion: user.data.worklocaltion,
          workaddress: user.data.workaddress,
          phone: user.data.phone,
          lineId: user.data.lineId,
          foodtype: user.data.foodtype,
          certName: user.data.certName,
          hdb: user.hdb,
          pwd: user.pwd,
          pdpa: user.pdpa,
          role: user.role,
          codeId: user.codeId,
          cecode: user.data.cecode ? user.data.cecode : null,
          admp: user.data.admp ? user.data.admp : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (res) {
        this.logger.log(`Success Register:  \n IP: ${ip}`);

        //Ex. Email
        const email = user.data.email;
        const subject =
          'สมัครเป็นสมาชิกศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่';
        const message = `
        เรียน: ${user.data.fnameTh} ${user.data.lnameTh} <br><br>

        <b style="font-size: 22px; color: blue;">สมัครสมาชิกสำเร็จ</b> <br><br>
        
        <b>รหัสสมาชิกคือ:</b> <span>${user.codeId}</span> <br>
        <hr><br><br>

        [รายละเอียดติดต่อ]<br>
        <b>Email: </b> <span>pgt.cmu@gmail.com</span><br>
        <b>Phone: </b> <span>+66 5394 8114</span>

        `;
        await this.emailService.sendEmail(email, subject, message);

        return {
          respCode: HttpStatus.CREATED,
          success: true,
          message:
            'The request was successful and a new resource has been created',
        };
      }
      return {
        success: false,
        respCode: HttpStatus.CONFLICT,
        message:
          'The request conflicts with the current state of the server (e.g., creating a duplicate resource).',
      };
    } catch (e) {
      if (e.code === 'P2002') {
        this.logger.error(
          `Error Register: \n ${HttpStatus.CONFLICT} \n IP: ${ip}`,
        );
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            code: e.code,
            error: 'Duplicate ID card number',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        this.logger.error(`Error Register: \n ${e.code} \n IP: ${ip}`);
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'An error Register',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('checkemail')
  async checkemail(@Body() data: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const res = await prisma.pGT_User.findFirst({
        where: {
          email: data.email,
        },
      });
      if (res) {
        this.logger.error(
          `Email already exists: \n ${data.email} \n IP: ${ip} \n Code: ${HttpStatus.CONFLICT}`,
        );
        return {
          respCode: HttpStatus.CONFLICT,
          success: false,
          message: 'This email is already in the system.',
        };
      }
      return {
        success: true,
        respCode: HttpStatus.OK,
        message: 'This email is available.',
      };
    } catch (e) {
      this.logger.error(
        `Error email: \n ${HttpStatus.INTERNAL_SERVER_ERROR} \n IP: ${ip}`,
      );
      throw new HttpException(
        {
          respCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error email',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check/email')
  async email(@Body() data: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const res = await prisma.pGT_User.findFirst({
        where: {
          email: data.email,
        },
      });
      if (res) {
        this.logger.log(`Email success: ${data.email} IP: ${ip}`);
        return {
          success: true,
          respCode: HttpStatus.CREATED,
          email: data.email,
        };
      } else {
        this.logger.error(`Invalid email: ${data.email} IP: ${ip}`);
        return {
          success: false,
          message: 'Invalid email',
        };
      }
    } catch (e) {
      this.logger.error(`Error email reset PWD: \n ${e.code} \n IP: ${ip}`);
      throw new HttpException(
        {
          respCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error email reset PWD',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('signin')
  async signin(@Body() user: DataUser, @Req() req: Request) {
    const ip = req.headers['x--forwarded-for'] || req.connection.remoteAddress;
    try {
      const userData = await prisma.pGT_User.findFirst({
        where: {
          email: user.email,
          pwd: user.pwd,
        },
      });

      if (userData) {
        const token = await this.authService.loginUser(userData);
        this.logger.log(`Change Password Success: ${userData.email} IP: ${ip}`);
        return {
          success: true,
          respCode: HttpStatus.OK,
          token: token,
        };
      } else {
        return {
          respCode: HttpStatus.BAD_REQUEST,
          success: false,
          message:
            'The request was invalid or cannot be understood by the server (e.g., incorrect or incomplete data).',
        };
      }
    } catch (e) {
      this.logger.error(
        `Email or password is invalid.: \n ${HttpStatus.INTERNAL_SERVER_ERROR} \n IP: ${ip}`,
      );
      throw new HttpException(
        {
          respCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An email or password is invalid.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('change/password')
  async changepassword(@Body() change: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const res = await prisma.pGT_User.update({
        where: {
          email: change.email,
        },
        data: {
          pwd: change.pwd,
        },
      });

      if (res) {
        this.logger.log(`Change Password Success: ${change.email} IP: ${ip}`);
        return {
          success: true,
          respCode: HttpStatus.CREATED,
        };
      }
    } catch (e) {
      this.logger.error(
        `Error Change Password: \n ${HttpStatus.INTERNAL_SERVER_ERROR} \n IP: ${ip}`,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error Change Password',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update/new/data/user')
  @UseGuards(AuthGuard)
  async newdatauser(
    @Body() user: { data: any; id: number },
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
      let res;
      if (user && user.data && user.data.admp) {
        res = await prisma.pGT_User.update({
          where: {
            id: Number(user.id),
          },
          data: {
            admp: user.data.admp,
            cecode: user.data.cecode,
            certName: user.data.certName,
            foodtype: user.data.foodtype,
            lineId: user.data.lineId,
            worklocaltion: user.data.worklocaltion,
          },
        });
      } else {
        res = await prisma.pGT_User.update({
          where: {
            id: Number(user.id),
          },
          data: {
            cecode: user.data.cecode,
            certName: user.data.certName,
            foodtype: user.data.foodtype,
            lineId: user.data.lineId,
            worklocaltion: user.data.worklocaltion,
          },
        });
      }

      if (res !== undefined) {
        this.logger.log(
          `Change Data Success: ${HttpStatus.CREATED} \n IP: ${ip} \n  ${user.id} `,
        );
        return {
          respCode: HttpStatus.CREATED,
          success: true,
          message:
            'The request was successful and a new resource has been created',
        };
      }
    } catch (e) {
      this.logger.error(
        `Error Change Password: \n ${HttpStatus.INTERNAL_SERVER_ERROR} \n IP: ${ip}`,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error Change Password',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('authorization/info')
  async info(@Headers('Authorization') auth: string) {
    try {
      const jwt = auth.replace('Bearer ', '');
      const payload = this.jwtService.decode(jwt);
      if (payload == null) {
        return {
          respCode: HttpStatus.NOT_FOUND,
          success: false,
          messages: 'The requested resource could not be found.',
        };
      }

      return { success: true, payload: payload, respCode: HttpStatus.OK };
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  @Get('member/count')
  async memberCount() {
    try {
      const res = await prisma.pGT_User.findMany();
      return {
        success: true,
        respCode: HttpStatus.CREATED,
        results: res.length,
      };
    } catch (e) {
      return { respCode: HttpStatus.BAD_REQUEST, message: 'BAD_REQUEST' };
    }
  }

  @Get('user/data/:id')
  @UseGuards(AuthGuard)
  async data(@Param('id') id: number, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_User.findFirst({
        where: {
          id: Number(id),
        },
        select: {
          worklocaltion: true,
          lineId: true,
          certName: true,
          cecode: true,
          admp: true,
          foodtype: true,
        },
      });
      return {
        respCode: HttpStatus.OK,
        success: true,
        result: res,
        message:
          ' The request was successful and the server has returned the requested data',
      };
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`,
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }

  @Get('list/user/:type')
  @UseGuards(AuthGuard)
  async alluser(@Param('type') type: string, @Req() req: Request) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {

      const decode64 = atob(type)
      const types = decode64.replace("heander ", "")

      let role;
      let res;

      if (types == "1") {
        role = 'Vet'
      } else if (types == "2") {
        role = 'Vet nurse'
      } else if (types == "3") {
        role = 'Vet tech'
      } else if (types == "4") {
        role = 'Scientist'
      }

      if (role !== '') {
         res = await prisma.pGT_User.findMany({
          where: {
            role: role
          },
          include: {
            PGT_title_Project: true
          }
        })
      } else {
         res = await prisma.pGT_User.findMany({
          include: {
            PGT_title_Project: true
          }
         })
         
      }

      if (res.length > 0) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          result: res,
          message:
            'The request was successful and the server has returned the requested data',
        }
      } else {
        return {
          respCode: HttpStatus.NO_CONTENT,
          success: false,
          message:
            'The request was successful, but there is no content to send in the response',
        }
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`,
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }
}
