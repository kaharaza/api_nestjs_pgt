import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Headers,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from 'src/service/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth.service';

import { Request } from 'express';
import { LineNotifyService } from 'src/line.service';

const prisma = new PrismaClient();

interface DataUser {
  gencode: string;
  name: string;
  agencyId: number;
  sentCode: number;
  openCode: number;
  fname: string;
  email: string;
  pwd: string;
  codeId: string;
}

@Controller('api/pgt/staff')
export class PGTStaffController {
  constructor(
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly lineNotifyService: LineNotifyService,
  ) {}

  @Get('list/agency')
  async agency() {
    try {
      const agencies = await prisma.pGT_Staff_Agency.findMany({});
      return {
        success: true,
        data: agencies,
      };
    } catch (e) {
      // จัดการข้อผิดพลาดและส่ง response ที่เหมาะสมกลับไป
      this.logger.error(`Error fetching agencies: ${e}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error occurred while fetching the list of agencies',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('authorization/info/staff')
  async infostaff(@Headers('Authorization') auth: string) {
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

      const agency = await prisma.pGT_Staff_Gencode.findFirst({
        where: {
          gencode: payload.codeId,
        },
        select: {
          agencyId: true,
          Pgt_Staff_Agency: true,
        },
      });

      if (payload && agency) {
        return {
          success: true,
          payload: { infoSub: payload, agency: agency },
          respCode: HttpStatus.OK,
        };
      }
    } catch (e) {
      return { status: 500, message: e.message };
    }
  }

  @Post('genarate/code')
  async genarate(@Body() code: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const payload = {
        name: code.name,
        agencyId: code.agencyId,
      };

      const gentoken = await this.authService.gencode(payload);

      if (gentoken) {
        await prisma.pGT_Staff_Gencode.create({
          data: {
            gencode: gentoken.access_token,
            name: code.name,
            agencyId: Number(code.agencyId),
          },
        });

       

        return { success: true, gen: gentoken };
      }
    } catch (e) {
      this.logger.error(`Error genarate code: \n ${e} \n IP: ${ip}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error genarate code',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('genarate/checkcode')
  async checkcode(@Body() code: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const check = await prisma.pGT_Staff_Gencode.findFirst({
        where: {
          gencode: code.gencode,
        },
      });

      if (check && check.sentCode === 1) {
        return {
          fail: false,
          respCode: 4004,
          meg: 'This code has already been used.',
        };
      } else if (check && check.openCode === 0) {
        return {
          fail: false,
          respCode: 4083,
          meg: 'Waiting for approval.',
        };
      } else if (check.sentCode === 0 && check.openCode === 1) {
        return { success: true, respCode: 2000, meg: 'This code is valid.' };
      }
    } catch (e) {
      this.logger.error(`Error Check code:\n ${e} \n IP: ${ip}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error Check code',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create/staff')
  async createstaff(@Body() user: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const res = await prisma.pGT_Staff_Create.create({
        data: {
          fname: user.fname,
          email: user.email,
          pwd: user.pwd,
          codeId: user.codeId,
        },
      });

      if (res) {
        const update = await prisma.pGT_Staff_Gencode.update({
          where: {
            gencode: user.codeId,
          },
          data: {
            sentCode: 1,
          },
        });
        if (update) {
          return { success: true, meg: 'success' };
        } else {
          return { fail: false, meg: 'update fail' };
        }
      }
    } catch (e) {
      this.logger.error(`Error Create User: \n ${e} \n IP: ${ip}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error Check code',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body() admin: DataUser, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const userDate = await prisma.pGT_Staff_Create.findFirst({
        where: {
          email: admin.email,
          pwd: admin.pwd,
        },
      });
      if (userDate) {
        const token = await this.authService.loginPgt(userDate);
        this.logger.log(
          `Successful login: \n - Name: ${userDate.fname} \n - Email: ${userDate.email} \n - CodeId: ${userDate.codeId} \n - IP: ${ip}`,
        );
        return { success: true, respCode: HttpStatus.OK, token: token };
      }

      this.logger.error(
        `Email or password invalid: \n - Email: ${admin.email} \n - IP: ${ip}`,
      );
      return {
        success: false,
        respCode: HttpStatus.BAD_REQUEST,
        meg: 'Email or password invalid',
      };
    } catch (e) {
      this.logger.error(`Error Create User: \n ${e} \n IP: ${ip}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'An error Check code',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
