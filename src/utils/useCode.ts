import { HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as CryptoJs from 'crypto-js';

const prisma = new PrismaClient();

export const useCheckEmailAdmin = async (email: string) => {
  const data = await prisma.cmuItAccount.findUnique({
    where: {
      email: email,
    },
  });
  return data;
};

export const useDecodecryptBody = (
  body: { encryptedData: string },
  secretKey: string,
) => {
  const dataBytes = CryptoJs.AES.decrypt(body.encryptedData, secretKey);
  const decryptedString = dataBytes.toString(CryptoJs.enc.Utf8);

  if (!decryptedString) {
    throw new Error('Decryption failed');
  }

  return decryptedString;
};

export const useDecodecryptQuery = (
  data: string | { encryptedData: string },
  secretKey: string,
) => {
  const cipherText = decodeURIComponent((data ?? '') as string);
  const bytes = CryptoJs.AES.decrypt(cipherText, secretKey);
  const decryptedString = bytes.toString(CryptoJs.enc.Utf8);

  if (!decryptedString) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      success: false,
      message: 'Decryption failed',
    };
  }
  return decryptedString;
};
