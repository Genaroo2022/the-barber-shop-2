import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type Bucket = { count: number; resetAt: number };

@Injectable()
export class SimpleRateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, max: number, ttlMs: number): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + ttlMs });
      return;
    }

    if (bucket.count >= max) {
      throw new HttpException('Demasiadas solicitudes. Intenta de nuevo en unos minutos.', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
  }
}

