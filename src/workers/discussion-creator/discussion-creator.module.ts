import { Module } from '@nestjs/common';
import { DiscussionCreatorService } from './discussion-creator.service';
import { SteamBotModule } from '../../steam-bot/steam-bot.module';

@Module({
  imports: [SteamBotModule],
  providers: [DiscussionCreatorService],
  exports: [DiscussionCreatorService],
})
export class DiscussionCreatorModule {}
