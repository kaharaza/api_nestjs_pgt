import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthGuard } from 'src/service/auth.guard';
import { LoggerService } from 'src/service/logger/logger.service';


const prisma = new PrismaClient();

interface DataProject {
  userId: string;
  titleId: number;
  transferSlip?: string;
  sentTransferSlip: string;
}

@Controller('api/pgt/sponsor')
export class SponsorController {
  constructor(
    private readonly logger: LoggerService,
  ) {}

  @Post('regi')
  @UseGuards(AuthGuard)
  async regiSponsor(@Body() sponsor: DataProject) {
    try {
      const row = await prisma.pGT_title_Project.findFirst({
        where: {
          userId: sponsor.userId,
          titleId: Number(sponsor.titleId),
        },
      });

      if (row) {
        return {
          success: false,
          respCode: HttpStatus.CONFLICT,
          message: 'This project information is already available.',
        };
      } else {
        await prisma.pGT_title_Project.create({
          data: {
            userId: sponsor.userId,
            titleId: Number(sponsor.titleId),
            sentTransferSlip: 'sponsor',
          },
        });

        return {
          respCode: HttpStatus.CREATED,
          success: true,
          message: 'add porject success',
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`,
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Get('list/data/projects')
  @UseGuards(AuthGuard)
  async listsponsordata() {
    try {
      const res = await prisma.pGT_title_Project.findMany({
        where: {
          sentTransferSlip: 'sponsor',
        },
        include: {
          pgt_user: true,
          pgt_register_project: true,
        },
      });
      if (res.length > 0) {
        return {
          success: true,
          result: res,
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`,
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }

  @Delete('delete/project/:id')
  @UseGuards(AuthGuard)
  async deleteprojectid(@Param('id') id: number) {
    try {
      await prisma.pGT_title_Project.delete({
        where: {
          id: Number(id),
        },
      });

      return {
        respCode: HttpStatus.OK,
        success: true,
        message: 'Delete success',
      };
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`,
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR ',
      };
    }
  }
}
