import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import SteamBot from './classes/steam-bot';

@Injectable()
export class SteamBotService implements OnModuleInit {
  #bots: SteamBot[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const dbBots = await this.prisma.bot.findMany();

    this.#bots = dbBots.map((bot) => {
      const steamBot = new SteamBot(bot);

      steamBot.on('cookies', this.#cookiesHandler.bind(this));

      return steamBot;
    });

    await Promise.all(this.#bots.map((bot) => bot.login()));
  }

  async #cookiesHandler(botId: number, botSteamID64: string, cookies: any[]) {
    this.prisma.bot
      .update({
        where: {
          id: botId,
        },
        data: {
          cookies: JSON.stringify(cookies),
          steamId: botSteamID64,
        },
      })
      .catch(console.error);
  }

  /** Возвращает бота, который готов работать по выбранному направлению */
  async getBotForWorker(workerType: 'bumper' | 'creator' | 'spammer') {
    const bots = (
      await this.prisma.bot.findMany({
        orderBy: {
          lastActionAt: 'asc',
        },
      })
    ).filter((bot) => {
      return !!bot.workers[workerType];
    });

    if (!bots.length) return null;

    const bot = this.#bots.find((b) => b.id === bots[0].id);

    await this.prisma.bot.update({
      where: {
        id: bot.id,
      },
      data: {
        lastActionAt: new Date(),
      },
    });

    return bot;
  }
}
