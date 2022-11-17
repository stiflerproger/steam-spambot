import { Module } from '@nestjs/common';
import { SteamBotService } from './steam-bot.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [SteamBotService, PrismaService],
  exports: [SteamBotService],
})
export class SteamBotModule {}
