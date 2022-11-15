import { Injectable } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';

@Injectable()
export class DiscussionCreatorService {
  constructor(private readonly steamBots: SteamBotService) {}

  async init() {}
}
