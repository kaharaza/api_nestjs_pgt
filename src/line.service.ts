import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LineNotifyService {
  async sendLineNotifyPGT(message: string): Promise<void> {
    try {
      const token = process.env.LINE_TOKEN_PGT;
      const url = 'https://notify-api.line.me/api/notify';
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(url, `message=${message}`, config);
    } catch (error) {
      console.error('Error sending Line Notify:', error.response.data);
      throw new Error('Failed to send Line Notify');
    }
  }

  async sendLinePGT_FIN(message: string): Promise<void> {
    try {
      const token = process.env.LINE_TOKEN_PGT_FIN;
      const url = 'https://notify-api.line.me/api/notify';
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(url, `message=${message}`, config);
    } catch (error) {
      console.error('Error sending Line Notify:', error.response.data);
      throw new Error('Failed to send Line Notify');
    }
  }
}
