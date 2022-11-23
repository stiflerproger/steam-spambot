import { Injectable, Logger } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';
import { PrismaService } from '../../prisma.service';
import { UpdateDiscussionIntervalDto } from '../../dto/update-discussion-interval.dto';

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

  getAllText() {
    return this.prisma.discusBumperText.findMany();
  }

  async addDiscussion(link: string) {
    const match = link.match(
      /https:\/\/steamcommunity\.com\/groups\/(\S+)\/discussions\/(\d+)\/(\d+)\//,
    );

    if (!match) {
      throw new Error('Ссылка на обсуждение не валидная!');
    }

    const groupId = match[1],
      forumId = match[2],
      discusId = match[3];

    const record = await this.prisma.workerDiscusBumper.findFirst({
      where: {
        groupId,
        forumId,
        discusId,
      },
    });

    if (record) {
      throw new Error('Это обсуждение уже добавлено!');
    }

    return await this.prisma.workerDiscusBumper.create({
      data: {
        groupId,
        forumId,
        discusId,
        bumpInterval: 20,
      },
    });
  }

  async updateDiscussionInterval(data: UpdateDiscussionIntervalDto) {
    return this.prisma.workerDiscusBumper.update({
      where: {
        id: data.id,
      },
      data: {
        bumpInterval: data.bumpInterval,
      },
    });
  }

  async getAllDiscussions() {
    return (await this.prisma.workerDiscusBumper.findMany()).map((e) => {
      const nextBump = Math.floor(
        Math.max(
          e.lastBumpAt.getTime() + e.bumpInterval * 60 * 1000 - Date.now(),
          0,
        ) / 1000,
      );

      return {
        ...e,
        nextBump,
      };
    });
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

    if (closerBump.timeout > 60000) {
      // если больше минуты ждать, то просто перепроверяем ближайший бампер, на случай добавления новых
      return setTimeout(this.prepareCloserBump.bind(this), 120000);
    } else {
      this.#bumperTimeout = setTimeout(
        this.#doBump.bind(this, closerBump.id),
        closerBump.timeout,
      );
    }
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

    try {
      const { discussionTitle, forumTitle, comment } =
        await botForBump.writeCommentInDiscussion(
          record.groupId,
          record.forumId,
          record.discusId,
          textRecord.text,
        );

      this.logger.log(
        `Бот #${botForBump.id} | ${discussionTitle} > ${forumTitle} | Написал: ${comment}` +
          `\r\n<a target="_blank" href="https://steamcommunity.com/groups/${record.groupId}/discussions/${record.forumId}/${record.discusId}/">ссылка на обсуждение</a>`,
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
          forumTitle,
          groupTitle: discussionTitle,
          lastBumpAt: new Date(),
        },
      });
    } catch (e) {
      this.logger.error(e);
    }

    return this.prepareCloserBump();
  }
}
