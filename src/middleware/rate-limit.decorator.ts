import { Throttle } from '@nestjs/throttler';


export function RateLimit(ttlSeconds: number, limit: number) {
  return Throttle({
    default: {
      ttl: ttlSeconds * 1000, // ถ้า config ใช้ ms
      limit,
    },
  });
}
