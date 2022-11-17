import { Injectable, Logger } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';
import { PrismaService } from '../../prisma.service';

// постить в список обсуждений, рандомную строку для бампа
// каждую тему поднимать раз в N минут

@Injectable()
export class DiscussionBumperService {
  logger = new Logger('BumperService');

  constructor(
    private readonly steamBots: SteamBotService,
    private readonly prisma: PrismaService,
  ) {}

  async init() {
    this.#startWorker();
  }

  #startWorker() {
    this.prepareCloserBump().then();
  }

  // проверка бампов в БД, и установка таймера на бамп
  private async prepareCloserBump() {
    clearTimeout(this.#bumperTimeout);

    const text = await this.prisma.discusBumperText.findMany();

    if (!text.length) {
      this.logger.log('Нет текста для бампа! Перепроверка через минуту');
      return setTimeout(this.prepareCloserBump.bind(this), 60000); // через минуту перепроверим наличие текста для бампа
    }

    const records = await this.prisma.workerDiscusBumper.findMany({
      orderBy: {
        lastBumpAt: 'asc',
      },
    });

    let closerBump = {
      id: 0,
      timeout: Infinity,
    };

    for (const record of records) {
      // вычислить время запуска бампа
      let nextBumpAfter =
        Math.max(
          record.lastBumpAt.getTime() +
            record.bumpInterval * 60 * 1000 -
            Date.now(),
          0,
        ) + 30000;

      if (nextBumpAfter < closerBump.timeout) {
        closerBump.id = record.id;
        closerBump.timeout = nextBumpAfter;
      }
    }

    if (!closerBump.id) {
      // нет записей в БД
      this.logger.log('Нет списка тем для бампа! Перепроверка через минуту');
      return setTimeout(this.prepareCloserBump.bind(this), 60000); // через минуту перепроверим наличие тем для бампа
    }

    this.logger.log(
      `Ближайший бамп через ${Math.floor(closerBump.timeout / 1000)} секунд!`,
    );
    this.#bumperTimeout = setTimeout(
      this.#doBump.bind(this, closerBump.id),
      closerBump.timeout,
    );
  }

  #bumperTimeout: NodeJS.Timeout;
  async #doBump(bumpId: number) {
    clearTimeout(this.#bumperTimeout);

    const record = await this.prisma.workerDiscusBumper.findFirst({
      where: {
        id: bumpId,
      },
    });

    const textRecord = await this.prisma.discusBumperText.findFirst({
      orderBy: {
        lastTimeUsed: 'asc',
      },
    });

    const botForBump = await this.steamBots.getBotForWorker('bumper');

    if (!botForBump) {
      this.logger.log('Бота для бампа не нашлось =(');
      return this.prepareCloserBump();
    }

    this.logger.log('Бампим');

    try {
      await botForBump.writeCommentInDiscussion(
        record.groupId,
        record.forumId,
        record.discusId,
        textRecord.text,
      );

      await this.prisma.discusBumperText.update({
        where: {
          id: textRecord.id,
        },
        data: {
          lastTimeUsed: new Date(),
        },
      });

      await this.prisma.workerDiscusBumper.update({
        where: {
          id: record.id,
        },
        data: {
          lastBumpAt: new Date(),
        },
      });
    } catch (e) {
      this.logger.error(e);
    }

    return this.prepareCloserBump();
  }
}
