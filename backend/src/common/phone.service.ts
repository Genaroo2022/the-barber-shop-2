import { Injectable } from '@nestjs/common';

@Injectable()
export class PhoneService {
  normalize(value: string): string {
    return (value ?? '').replace(/\D/g, '');
  }
}

