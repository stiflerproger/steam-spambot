import { Module } from '@nestjs/common';
import { GroupSpammerService } from './group-spammer.service';
import { SteamBotModule } from '../../steam-bot/steam-bot.module';

@Module({
  imports: [SteamBotModule],
  providers: [GroupSpammerService],
  exports: [GroupSpammerService],
})
export class GroupSpammerModule {}
