import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';

@Injectable()
export class AuthCMUService {
  private clientId = process.env.CMU_CLIENT_ID;
  private clientSecret = process.env.CMU_CLIENT_SECRET;
  private redirectUri = process.env.CMU_REDIRECT_URI;
  private tokenUrl = process.env.CMU_TOKEN_URI;

  async exchangeCodeForToken(code: string): Promise<string> {
    const params = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    try {
      const response = await axios.post(this.tokenUrl, qs.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status !== 200) {
        throw new Error('Error exchanging code for token');
      }
      const accessToken = response.data.access_token;

      return accessToken;
    } catch (error: any) {
      console.error('CMU TOKEN ERROR:', error.response?.data || error.message);
      throw error;
    }
  }
}
