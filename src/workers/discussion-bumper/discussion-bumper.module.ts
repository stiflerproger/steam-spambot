import { Module } from '@nestjs/common';
import { DiscussionBumperService } from './discussion-bumper.service';
import { SteamBotModule } from '../../steam-bot/steam-bot.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [SteamBotModule],
  providers: [DiscussionBumperService, PrismaService],
  exports: [DiscussionBumperService],
})
export class DiscussionBumperModule {}
