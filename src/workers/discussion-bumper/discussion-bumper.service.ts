import { Injectable } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';

@Injectable()
export class DiscussionBumperService {
  constructor(private readonly steamBots: SteamBotService) {}

  async init() {
    console.log('Инициирован');
  }
}
