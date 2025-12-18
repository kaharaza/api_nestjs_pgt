import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AuthGuard } from "src/service/auth.guard";
import { Request } from "express";
import { LoggerService } from "src/service/logger/logger.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { now } from "moment-timezone";
import { EmailService } from "src/email.service";
import { LineNotifyService } from "src/line.service";

const prisma = new PrismaClient();
const fs = require("fs");

interface DataProject {
  titleId: number;
  codeId: string;
  userId: string;
}

@Controller("api/pgt/project")
export class PGTProjectController {
  constructor(
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
    private readonly lineNotifyService: LineNotifyService
  ) {}

  @Get("list/home")
  async listhome() {
    try {
      const res = await prisma.pGT_Register_Project.findMany({
        include: {
          PGT_title_Project: true,
        },
        orderBy: {
          close_regi: "desc",
        },
        take: 5,
      });

      if (res) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
          results: res,
          count: res.length,
        };
      }
    } catch (e) {
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("list/projects")
  async projects() {
    try {
      const currentDate = new Date();
      const res = await prisma.pGT_Register_Project.findMany({
        where: {
          close_regi: {
            gt: currentDate,
          },
        },
        include: {
          PGT_title_Project: true,
        },
        orderBy: {
          close_regi: "desc",
        },
      });
      if (res) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
          results: res,
        };
      }
    } catch (e) {
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("list/user/registe/:titleId")
  @UseGuards(AuthGuard)
  async listuserregister(
    @Param("titleId") titleId: string,
    @Req() req: Request
  ) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const decode64 = atob(titleId);
      const isTitleId = decode64.replace("heander ", "");
      const isValueId = parseInt(isTitleId);

      const res = await prisma.pGT_title_Project.findMany({
        where: {
          titleId: isValueId,
          OR: [
            { sentTransferSlip: "approved" },
            { sentTransferSlip: "sponsor" },
          ],
        },
        include: {
          pgt_user: {
            select: {
              prefix: true,
              fnameTh: true,
              lnameTh: true,
              role: true,
              email: true,
              phone: true,
              cecode: true,
              certName: true,
              worklocaltion: true,
              foodtype: true
            },
          },
          pgt_register_project: {
            select: {
              title: true,
            },
          },
        },
      });

      if (res.length > 0) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
          results: res,
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR",
      };
    }
  }

  @Get("list/title/:titleid")
  async listtitle(@Param("titleid") titleId: number) {
    try {
      const res = await prisma.pGT_Register_Project.findMany({
        where: {
          id: Number(titleId),
        },
        select: {
          title: true,
          detail: true,
          PGT_CheckIn: true,
        },
      });

      if (res[0].PGT_CheckIn.length > 0) {
        const checkdate = await prisma.pGT_CheckIn.findMany({
          where: {
            dateCheckin: new Date().toLocaleDateString(),
          },
          include: {
            pgt_user: {
              select: {
                prefix: true,
                fnameTh: true,
                lnameTh: true,
                role: true,
              },
            },
          },
          orderBy: {
            id: "desc",
          },
        });

        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
          result: res,
          counts: checkdate.length,
          lists: checkdate,
        };
      } else {
        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
          result: res,
        };
      }
    } catch (e) {
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("list/sent/transfer/:id/:slip")
  @UseGuards(AuthGuard)
  async transferslip(
    @Param("id") id: string,
    @Param("slip") slip: string,
    @Req() req: Request
  ) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_title_Project.findMany({
        where: {
          userId: id,
          sentTransferSlip: slip,
        },
        include: {
          pgt_register_project: true,
        },
      });

      if (res.length > 0) {
        return {
          respCode: HttpStatus.OK,
          tag: slip,
          results: res,
          success: true,
          message:
            "The request was successful and the server has returned the requested data.",
        };
      } else {
        return {
          respCode: HttpStatus.NO_CONTENT,
          tag: slip,
          success: false,
          message:
            "The request was successful, but there is no content to send in the response.",
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR",
      };
    }
  }

  @Get("count/:id")
  @UseGuards(AuthGuard)
  async count(@Param("id") id: string, @Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_title_Project.findMany({
        where: {
          userId: id,
        },
        select: {
          sentTransferSlip: true,
        },
      });

      const pendingCount = res.filter(
        (record) => record.sentTransferSlip === "pending"
      ).length;
      const waitingCount = res.filter(
        (record) => record.sentTransferSlip === "waiting"
      ).length;
      const approvedCount = res.filter(
        (record) => record.sentTransferSlip === "approved"
      ).length;
      const failCount = res.filter(
        (record) => record.sentTransferSlip === "fail"
      ).length;

      return {
        status: HttpStatus.OK,
        success: true,
        message:
          "The request was successful and the server has returned the requested data",
        counts: {
          pending: pendingCount,
          waiting: waitingCount,
          approved: approvedCount,
          fail: failCount,
        },
      };
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("count")
  @UseGuards(AuthGuard)
  async countdoucment(@Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_title_Project.findMany({});

      const pendingCount = res.filter(
        (record) => record.sentTransferSlip === "pending"
      ).length;
      const waitingCount = res.filter(
        (record) => record.sentTransferSlip === "waiting"
      ).length;
      const approvedCount = res.filter(
        (record) => record.sentTransferSlip === "approved"
      ).length;
      const failCount = res.filter(
        (record) => record.sentTransferSlip === "fail"
      ).length;

      return {
        status: HttpStatus.OK,
        success: true,
        message:
          "The request was successful and the server has returned the requested data",
        counts: {
          pending: pendingCount,
          waiting: waitingCount,
          approved: approvedCount,
          fail: failCount,
        },
      };
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("list/status/:statu")
  @UseGuards(AuthGuard)
  async liststatus(@Param("statu") statu: string, @Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_title_Project.findMany({
        where: {
          sentTransferSlip: statu,
        },
        include: {
          pgt_register_project: {
            select: {
              price_regi: true,
              title: true,
            },
          },

          pgt_user: {
            select: {
              prefix: true,
              role: true,
              fnameTh: true,
              lnameTh: true,
              email: true,
              address: true,
              parish: true,
              district: true,
              ethnicity: true,
              county: true,
              zipcode: true,
              idCard: true,
              phone: true,
              PGT_Send_Receipt: true,
            },
          },
        },
        orderBy: {
          titleId: "desc",
        },
      });

      if (res) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          results: res,
          message:
            "The request was successful and the server has returned the requested data",
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("select/list/project")
  @UseGuards(AuthGuard)
  async listproject(@Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_Register_Project.findMany({
        select: {
          id: true,
          title: true,
        },
      });

      if (res) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          results: res,
          message:
            "The request was successful and the server has returned the requested data",
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Post("regi/prj")
  @UseGuards(AuthGuard)
  async prj(@Body() project: DataProject, @Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const check = await prisma.pGT_title_Project.findFirst({
        where: {
          userId: project.codeId,
          titleId: project.titleId,
        },
      });

      if (check) {
        return {
          success: false,
          respCode: HttpStatus.CONFLICT,
          message: "This project information is already available.",
        };
      } else {
        const res = await prisma.pGT_title_Project.create({
          data: {
            userId: project.codeId,
            titleId: project.titleId,
            createdAt: new Date(now()),
            autodate_cancel: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        if (res) {
          const user = await prisma.pGT_title_Project.findFirst({
            where: {
              userId: project.codeId,
              titleId: project.titleId,
            },
            select: {
              userId: true,
              titleId: true,
              createdAt: true,
              pgt_user: {
                select: {
                  prefix: true,
                  fnameTh: true,
                  lnameTh: true,
                  role: true,
                  email: true,
                },
              },
              pgt_register_project: {
                select: {
                  title: true,
                  detail: true,
                  price_regi: true,
                },
              },
            },
          });

          if (user) {
            //  Ex. Email
            const email = user.pgt_user.email;
            const subject = `ท่านได้ลงทะเบียนเข้าร่วม ${user.pgt_register_project.title}`;
            const message = `
          เรียน: ${user.pgt_user.fnameTh} ${user.pgt_user.lnameTh} <br><br>

         
          <b style="font-size: 22px; color: blue;">สมัครเข้าร่วมโครงการสำเร็จ</b> <br><br>
          <b>รหัสสมาชิกคือ:</b> <span>${user.userId}</span> <br>
          <b>Role:</b> <span>${user.pgt_user.role}</span> <br><br>

          <b>ชื่อโครงการ:</b> <span>${
            user.pgt_register_project.title
          }</span> <br>
          <b>อัตราค่าลงทะเบียน:</b> <span>${
            user.pgt_register_project.price_regi
          }</span> <br>
          <b>เวลาที่สมัคร:</b> <span>${user.createdAt.toLocaleString()}</span> <br><br>

          <b>*กรุณาแนบสลิปเงินโอน:</b> <span style="color: red;">กรุณาแนบสลิปเงินโอนภายใน 24 ชั่วโมง หากเลยเวลาที่กำหนด ระบบจะทำการ ยกเลิกโครงการของท่าน </span> <br>
          <hr><br>

          [รายละเอียดติดต่อ]<br>
          <b>Email: </b> <span>pgt.cmu@gmail.com</span><br>
          <b>Phone: </b> <span>+66 5394 8114</span>

          `;
            await this.emailService.sendEmail(email, subject, message);
            return {
              respCode: HttpStatus.CREATED,
              success: true,
              message:
                "The request was successful and a new resource has been created",
            };
          }
        }
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Post("upload/slip/user")
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor("myFile", {
      storage: diskStorage({
        destination: "./upload/PGT/Slip",
        filename: (req, file, callback) => {
          const date = new Date();
          const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`; // Format as YYYYMMDD
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          const newFilename = `${formattedDate}_${randomName}${extname(
            file.originalname
          )}`;
          callback(null, newFilename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    })
  )
  async useruploadslip(
    @Body() body: { userId: number; oldslip?: string },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;

    try {
      if (body.oldslip && body.userId && file.filename) {
        const banner = await prisma.pGT_title_Project.findFirst({
          where: {
            transferSlip: body.oldslip,
            id: Number(body.userId),
          },
        });

        if (banner) {
          try {
            await fs.promises.unlink(
              "./upload/PGT/Slip/" + banner.transferSlip
            );
          } catch (err) {
            this.logger.error(`Failed to delete old slip: ${err}`);
            return {
              respCode: HttpStatus.ACCEPTED,
              success: false,
              message:
                "The request has been accepted for processing, but the processing is not yet complete.",
            };
          }

          const res = await prisma.pGT_title_Project.update({
            where: {
              id: Number(body.userId),
            },
            data: {
              transferSlip: file.filename,
              sentTransferSlip: "waiting",
              W_updatedAt: new Date(),
              F_updatedAt: null,
              remaker: null,
              autodate_cancel: null,
            },
          });

          if (res) {
            return {
              respCode: HttpStatus.CREATED,
              success: true,
              message:
                "The request was successful and a new resource has been created",
            };
          }
        }
      } else if (body.userId && file.filename) {
        const res = await prisma.pGT_title_Project.update({
          where: {
            id: Number(body.userId),
          },
          data: {
            transferSlip: file.filename,
            sentTransferSlip: "waiting",
            W_updatedAt: new Date(),
            autodate_cancel: null,
          },
        });

        if (res) {
          return {
            respCode: HttpStatus.CREATED,
            success: true,
            message:
              "The request was successful and a new resource has been created",
          };
        }
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR",
      };
    }
  }

  @Post("add/send/receipt")
  @UseGuards(AuthGuard)
  async receipt(@Body() user: DataProject, @Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;

    try {
      const checkData = await prisma.pGT_Send_Receipt.findFirst({
        where: {
          userId: user.userId,
          titleId: Number(user.titleId),
        },
      });

      if (checkData) {
        return {
          respCode: HttpStatus.CONFLICT,
          success: false,
          message: "Duplicate resources are created.",
        };
      } else {
        const res = await prisma.pGT_Send_Receipt.create({
          data: {
            userId: user.userId,
            titleId: user.titleId,
            dateSend: new Date().toLocaleDateString(),
            timeSend: new Date().toLocaleTimeString(),
          },
        });

        if (res) {
          return {
            respCode: HttpStatus.CREATED,
            success: true,
            message:
              "The request was successful and a new resource has been created.",
          };
        }
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR",
      };
    }
  }

  @Delete("delect/prj/:userId/:id")
  @UseGuards(AuthGuard)
  async delect(
    @Param("userId") userId: string,
    @Param("id") id: number,
    @Req() req: Request
  ) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      const res = await prisma.pGT_title_Project.delete({
        where: {
          id: Number(id),
          userId: userId,
        },
      });

      if (res) {
        this.logger.log(
          `Successful Delect: \n IP: ${ip} \n respCode: ${HttpStatus.OK} \n Code: ${userId}`
        );
        return {
          respCode: HttpStatus.OK,
          success: true,
          message:
            "The request was successful and the server has returned the requested data",
        };
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Put("update/status/transfer")
  @UseGuards(AuthGuard)
  async statustransfer(@Body() transfer: any, @Req() req: Request) {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket.remoteAddress;
    try {
      if (transfer.sentTransferSlip === "fail") {
        const res = await prisma.pGT_title_Project.updateMany({
          where: {
            userId: transfer.userId.toString(),
            titleId: Number(transfer.titleId),
          },
          data: {
            sentTransferSlip: transfer.sentTransferSlip,
            F_updatedAt: new Date(transfer.newdate),
            remaker: transfer.remark,
          },
        });

        if (res) {
          const user = await prisma.pGT_title_Project.findFirst({
            where: {
              userId: transfer.userId.toString(),
              titleId: Number(transfer.titleId),
            },
            select: {
              userId: true,
              titleId: true,
              remaker: true,
              pgt_user: {
                select: {
                  prefix: true,
                  fnameTh: true,
                  lnameTh: true,
                  role: true,
                  email: true,
                },
              },
              pgt_register_project: {
                select: {
                  title: true,
                },
              },
            },
          });

          //  Ex. Email
          const email = user.pgt_user.email;
          const subject =
            "ชำระเงินค่าลงทะเบียนไม่สำเร็จ ศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่";
          const message = `
          เรียน: ${user.pgt_user.fnameTh} ${user.pgt_user.lnameTh} <br><br>

          <b style="font-size: 24px;">${user.pgt_register_project.title}</b> <br>
          <b style="font-size: 20px; color: red;">ชำระเงินค่าลงทะเบียนไม่สำเร็จ</b> <br><br>
          <b>รหัสสมาชิกคือ:</b> <span>${user.userId}</span> <br>
          <b>Role:</b> <span>${user.pgt_user.role}</span> <br><br>
          <b>หมายเหตุ:</b> <span style="color: red;">${user.remaker}</span> <br>
          <hr><br>

          [รายละเอียดติดต่อ]<br>
          <b>Email: </b> <span>pgt.cmu@gmail.com</span><br>
          <b>Phone: </b> <span>+66 5394 8114</span>

          `;
          await this.emailService.sendEmail(email, subject, message);

          return {
            respCode: HttpStatus.CREATED,
            success: true,
            message:
              "The request was successful and a new resource has been updated",
          };
        }
      }

      if (transfer.sentTransferSlip === "approved") {
        const res = await prisma.pGT_title_Project.updateMany({
          where: {
            userId: transfer.userId.toString(),
            titleId: Number(transfer.titleId),
          },
          data: {
            sentTransferSlip: transfer.sentTransferSlip,
            S_updatedAt: new Date(transfer.newdate),
          },
        });

        if (res) {
          const user = await prisma.pGT_title_Project.findFirst({
            where: {
              userId: transfer.userId.toString(),
              titleId: Number(transfer.titleId),
            },
            select: {
              userId: true,
              titleId: true,
              pgt_user: {
                select: {
                  prefix: true,
                  fnameTh: true,
                  lnameTh: true,
                  role: true,
                  email: true,
                },
              },
              pgt_register_project: {
                select: {
                  title: true,
                },
              },
            },
          });

          //  Ex. Email
          const email = user.pgt_user.email;
          const subject =
            "ยืนยันการตรวจสอบสลิปการโอนเงินสำเร็จ (ศูนย์การศึกษาระดับบัณฑิตศึกษา คณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่)";
          const message = `
            เรียน: ${user.pgt_user.fnameTh} ${user.pgt_user.lnameTh} <br><br>

            <b style="font-size: 24px;">${user.pgt_register_project.title}</b> <br>
            <b style="font-size: 20px; color: blue;">ชำระเงินค่าลงทะเบียนสำเร็จ</b> <br>
            <b>รหัสสมาชิกคือ:</b> <span>${user.userId}</span> <br>
            <b>Role:</b> <span>${user.pgt_user.role}</span> <br>
            <hr><br>

            [รายละเอียดติดต่อ]<br>
            <b>Email: </b> <span>pgt.cmu@gmail.com</span><br>
            <b>Phone: </b> <span>+66 5394 8114</span>
            `;

          await this.emailService.sendEmail(email, subject, message);

          return {
            respCode: HttpStatus.CREATED,
            success: true,
            message:
              "The request was successful and a new resource has been updated",
          };
        }
      }

      if (transfer.sentTransferSlip === "waiting") {
        const res = await prisma.pGT_title_Project.updateMany({
          where: {
            userId: transfer.userId.toString(),
            titleId: Number(transfer.titleId),
          },
          data: {
            sentTransferSlip: transfer.sentTransferSlip,
            S_updatedAt: null,
            F_updatedAt: null,
            remaker: null,
          },
        });

        if (res) {
          return {
            respCode: HttpStatus.CREATED,
            success: true,
            message:
              "The request was successful and a new resource has been updated",
          };
        }
      }
    } catch (e) {
      this.logger.error(
        `INTERNAL_SERVER_ERROR: \n IP: ${ip} \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }

  @Get("list/titleId/:status/:id")
  @UseGuards(AuthGuard)
  async listtiile(@Param("id") id: number, @Param("status") status: string) {
    try {
      const res = await prisma.pGT_title_Project.findMany({
        where: {
          titleId: Number(id),
          sentTransferSlip: status,
        },
        include: {
          pgt_register_project: {
            select: {
              price_regi: true,
              title: true,
            },
          },
          pgt_user: {
            select: {
              prefix: true,
              role: true,
              fnameTh: true,
              lnameTh: true,
              email: true,
              address: true,
              parish: true,
              district: true,
              ethnicity: true,
              county: true,
              zipcode: true,
              idCard: true,
              phone: true,
              PGT_Send_Receipt: true,
            },
          },
        },
        orderBy: {
          titleId: "desc",
        },
      });

      if (res.length > 0) {
        return {
          respCode: HttpStatus.OK,
          success: true,
          results: res,
          message:
            "The request was successful and the server has returned the requested data",
        };
      } else {
        return {
          respCode: HttpStatus.NOT_FOUND,
          success: false,
          message: "Not found data",
        };
      }
    } catch (e) {
      console.log(e);
      this.logger.error(
        `INTERNAL_SERVER_ERROR:  \n respCode: ${HttpStatus.INTERNAL_SERVER_ERROR} \n Error message: ${e}`
      );
      return {
        respCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "INTERNAL_SERVER_ERROR ",
      };
    }
  }
}
