// logger.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as moment from 'moment-timezone';


@Injectable()
export class LoggerService extends Logger {
  private readonly logFilePath: string = './src/log/logfile.log'; // กำหนด path ของไฟล์ log
  private readonly timezone: string = 'Asia/Bangkok'; // กำหนด timezone ให้เป็นเวลาในประเทศไทย

  error(message: string) {
    super.error(message);
    this.writeLogToFile(`[ERROR] ${this.getCurrentDateTime()} - ${message}\n`);
  }

  log(message: string) {
    super.log(message);
    this.writeLogToFile(`[LOG] ${this.getCurrentDateTime()} - ${message}\n`);
  }

  private writeLogToFile(message: string) {
    fs.appendFile(this.logFilePath, message, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      } else {
        console.log('Successfully wrote to log file');
      }
    });
  }

  private getCurrentDateTime(): string {
    return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
  }
}


