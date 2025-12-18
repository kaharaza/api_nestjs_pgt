import {
  Body,
  Controller,
  Get,

  HttpStatus,
  Post,

  UseGuards,
  Param,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AuthGuard } from 'src/service/auth.guard';
import { LoggerService } from 'src/service/logger/logger.service';

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
  userId: string;
  titleId: number;
}

@Controller('api/pgt/checkin')
export class PGTCheckInController {
  constructor(private readonly logger: LoggerService) {}

  @Post('check/in')
  async checkin(@Body() user: DataUser) {
    try {
      const checkUser = await prisma.pGT_title_Project.findFirst({
        where: {
          userId: user.userId,
          titleId: Number(user.titleId),
        },
      });

      if (checkUser.sentTransferSlip === 'sponsor') {
        const checkin = await prisma.pGT_CheckIn.findFirst({
          where: {
            userId: user.userId,
            titleId: Number(user.titleId),
            dateCheckin: new Date().toLocaleDateString(),
          },
        });
        if (checkin) {
          return {
            success: false,
            respCode: HttpStatus.CONFLICT,
            message: 'This project information is already available.',
          };
        } else {
          const res = await prisma.pGT_CheckIn.create({
            data: {
              userId: checkUser.userId,
              titleId: checkUser.titleId,
              dateCheckin: new Date().toLocaleDateString(),
              timeCheckin: new Date().toLocaleTimeString(),
            },
          });
          if (res) {
            return {
              respCode: HttpStatus.CREATED,
              success: true,
              message:
                'The request was successful and a new resource has been created',
            };
          }
        }
      }

      if (checkUser.sentTransferSlip === 'approved') {
        if (!checkUser || checkUser.S_updatedAt == null) {
          return {
            respCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: 'Not yet approved by finance.',
          };
        } else {
          const checkin = await prisma.pGT_CheckIn.findFirst({
            where: {
              userId: user.userId,
              titleId: Number(user.titleId),
              dateCheckin: new Date().toLocaleDateString(),
            },
          });

          if (checkin) {
            return {
              success: false,
              respCode: HttpStatus.CONFLICT,
              message: 'This project information is already available.',
            };
          } else {
            const res = await prisma.pGT_CheckIn.create({
              data: {
                userId: checkUser.userId,
                titleId: checkUser.titleId,
                dateCheckin: new Date().toLocaleDateString(),
                timeCheckin: new Date().toLocaleTimeString(),
              },
            });
            if (res) {
              return {
                respCode: HttpStatus.CREATED,
                success: true,
                message:
                  'The request was successful and a new resource has been created',
              };
            }
          }
        }
      }
    } catch (e) {
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }

  @Get('list/name/check/in/:titleId')
  @UseGuards(AuthGuard)
  async listnamecheckin(@Param('titleId') titleId: string) {
    try {
      const decode64 = atob(titleId);
      const isTitleId = decode64.replace('heander ', '');
      const isValueId = parseInt(isTitleId);

      let res;

      if (isValueId > 0) {
        res = await prisma.pGT_CheckIn.findMany({
          where: {
            titleId: Number(isTitleId),
          },
          include: {
            pgt_user: true,
          },
          orderBy: {
            dateCheckin: 'desc',
          },
        });
      } else {
        res = await prisma.pGT_CheckIn.findMany({
          include: {
            pgt_user: true,
          },
          orderBy: {
            dateCheckin: 'desc',
          },
        });
      }

      if (res.length > 0) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          results: res,
          message:
            ' The request was successful and the server has returned the requested data',
        };
      } else {
        return {
          respCode: HttpStatus.NO_CONTENT,
          success: false,
          message:
            ' The request was successful, but there is no content to send in the response',
        };
      }
    } catch (e) {
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }
}
