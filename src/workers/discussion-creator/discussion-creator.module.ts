import { Module } from '@nestjs/common';
import { DiscussionCreatorService } from './discussion-creator.service';
import { SteamBotModule } from '../../steam-bot/steam-bot.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [SteamBotModule],
  providers: [DiscussionCreatorService, PrismaService],
  exports: [DiscussionCreatorService],
})
export class DiscussionCreatorModule {}
