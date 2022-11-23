import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import SteamBot from './classes/steam-bot';
import { UpdateBotWorkersDto } from '../dto/update-bot-workers.dto';
import { AddBotDto } from '../dto/add-bot.dto';
import { Bot } from '@prisma/client';

@Injectable()
export class SteamBotService implements OnModuleInit {
  #bots: SteamBot[] = [];
  logger: Logger = new Logger('SteamBotService');

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

  private async addAndStartBot(bot: Bot) {
    const steamBot = new SteamBot(bot);
    steamBot.on('cookies', this.#cookiesHandler.bind(this));
    await steamBot.login(false, 1);

    this.#bots.push(steamBot);
  }

  async getAllBots() {
    return (
      await this.prisma.bot.findMany({
        orderBy: {
          id: 'asc',
        },
      })
    ).map((e) => {
      const sleepSec = Math.floor(
        Math.max(
          (e.lastActionAt.getTime() + e.sleepInterval * 60000 - Date.now()) /
            1000,
          0,
        ),
      );

      return {
        ...e,
        sleepSec,
      };
    });
  }

  async addNewBot(data: AddBotDto) {
    const bot = await this.prisma.bot.findFirst({
      where: {
        login: data.login,
      },
    });

    if (bot) {
      throw new Error('Такой бот уже добавлен');
    }

    const newBot = await this.prisma.bot.create({
      data,
    });

    try {
      this.logger.log('Проверяю нового бота на валидность данных..');
      await this.addAndStartBot(newBot);
      this.logger.log('Бот в норме!');
    } catch (e) {
      await this.prisma.bot.delete({
        where: {
          id: newBot.id,
        },
      });

      throw new Error(e);
    }

    return { success: true };
  }

  async updateBotWorkers(data: UpdateBotWorkersDto) {
    const bot = await this.prisma.bot.findFirstOrThrow({
      where: { id: data.botId },
    });

    if (
      bot.workers['bumper'] === data.bumper &&
      bot.workers['spammer'] === data.spammer &&
      bot.workers['creator'] === data.creator &&
      bot.sleepInterval === data.sleepInterval
    ) {
      return { success: true };
    }

    await this.prisma.bot.update({
      where: { id: bot.id },
      data: {
        sleepInterval: data.sleepInterval,
        workers: {
          bumper: data.bumper,
          spammer: data.spammer,
          creator: data.creator,
        },
      },
    });

    return { success: true };
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
        where: {
          lastActionAt: {
            lt: new Date(),
          },
        },
        orderBy: {
          lastActionAt: 'asc',
        },
      })
    ).filter((bot) => {
      return (
        !!bot.workers[workerType] &&
        Date.now() - (bot.lastActionAt.getTime() + bot.sleepInterval * 60000) >
          0
      ); // убираем ботов, которые не отдохнули
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
