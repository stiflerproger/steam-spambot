import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroupSpammerModule } from './workers/group-spammer/group-spammer.module';
import { DiscussionBumperModule } from './workers/discussion-bumper/discussion-bumper.module';
import { DiscussionCreatorModule } from './workers/discussion-creator/discussion-creator.module';
import { SteamBotModule } from './steam-bot/steam-bot.module';
import { PrismaService } from './prisma.service';
import { MyLogger } from './logger.service';

@Module({
  imports: [
    SteamBotModule,
    GroupSpammerModule,
    DiscussionBumperModule,
    DiscussionCreatorModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, MyLogger],
})
export class AppModule {}
