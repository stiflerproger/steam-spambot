import { Module } from '@nestjs/common';
import { DiscussionBumperService } from './discussion-bumper.service';
import { SteamBotModule } from '../../steam-bot/steam-bot.module';

@Module({
  imports: [SteamBotModule],
  providers: [DiscussionBumperService],
  exports: [DiscussionBumperService],
})
export class DiscussionBumperModule {}
