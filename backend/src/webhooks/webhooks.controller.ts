import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('/api/webhooks/whatsapp')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
    @Res() res?: Response,
  ) {
    const verified = this.webhooksService.verify(mode, token, challenge);
    if (!res) {
      return verified;
    }

    if (!verified) {
      return res.status(403).send('forbidden');
    }

    return res.status(200).send(verified);
  }

  @Post()
  @HttpCode(200)
  receive(@Body() payload: unknown) {
    return this.webhooksService.handleWebhook(payload);
  }
}

