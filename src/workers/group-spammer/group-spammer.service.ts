import { Injectable } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';

@Injectable()
export class GroupSpammerService {
  constructor(private readonly steamBots: SteamBotService) {}

  async init() {}
}
