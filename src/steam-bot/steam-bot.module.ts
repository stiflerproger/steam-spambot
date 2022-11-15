import { Module } from '@nestjs/common';
import { SteamBotService } from './steam-bot.service';

@Module({
  providers: [SteamBotService],
  exports: [SteamBotService],
})
export class SteamBotModule {}
