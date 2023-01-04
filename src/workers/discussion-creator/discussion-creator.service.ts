import { Injectable, Logger } from '@nestjs/common';
import { SteamBotService } from '../../steam-bot/steam-bot.service';
import { PrismaService } from '../../prisma.service';
import { UpdateCreateIntervalDto } from '../../dto/update-create-interval.dto';

// создаётся только в APP группе tradingforum
@Injectable()
export class DiscussionCreatorService {
  logger = new Logger('ForumService');

  constructor(
    private readonly steamBots: SteamBotService,
    private readonly prisma: PrismaService,
  ) {}

  async init() {
    this.#startWorker();
  }

  #startWorker() {
    this.prepareCloserCreate().then();
  }

  async getAllText() {
    return this.prisma.discusCreatorText.findMany();
  }

  async updateCreateInterval(data: UpdateCreateIntervalDto) {
    return this.prisma.workerDiscusCreator.update({
      where: {
        id: data.id,
      },
      data: {
        createInterval: data.createInterval,
      },
    });
  }

  async getAllForums() {
    return (await this.prisma.workerDiscusCreator.findMany()).map((e) => {
      const nextCreate = Math.floor(
        Math.max(
          e.lastCreatedAt.getTime() + e.createInterval * 60 * 1000 - Date.now(),
          0,
        ) / 1000,
      );

      return {
        ...e,
        nextCreate,
      };
    });
  }

  private async prepareCloserCreate() {
    clearTimeout(this.#creatorTimeout);

    const text = await this.prisma.discusCreatorText.findFirst({
      orderBy: {
        lastTimeUsed: 'asc',
      },
    });

    if (!text) {
      this.logger.log(
        'Нет тем для создания обсуждения! Перепроверка через минуту',
      );
      return setTimeout(this.prepareCloserCreate.bind(this), 60000); // через минуту перепроверим наличие текста для бампа
    }

    const record = await this.prisma.workerDiscusCreator.findFirst();

    if (!record) {
      this.logger.log('APP не добавлен. Нужно добавить в БД');
      return setTimeout(this.prepareCloserCreate.bind(this), 60000); // через минуту перепроверим наличие текста для бампа
    }

    const nextCreateAfter =
      Math.max(
        record.lastCreatedAt.getTime() +
          record.createInterval * 60 * 1000 -
          Date.now(),
        0,
      ) + 30000;

    this.logger.log(
      `Создание темы через ${Math.floor(nextCreateAfter / 1000)} секунд!`,
    );

    if (nextCreateAfter > 2 * 60 * 1000) {
      return setTimeout(this.prepareCloserCreate.bind(this), 120000);
    }

    this.#creatorTimeout = setTimeout(
      this.#doCreate.bind(this, record.id),
      nextCreateAfter,
    );
  }

  #creatorTimeout: NodeJS.Timeout;
  async #doCreate(workerId: number) {
    clearTimeout(this.#creatorTimeout);

    const record = await this.prisma.workerDiscusCreator.findFirst({
      where: {
        id: workerId,
      },
    });

    const text = await this.prisma.discusCreatorText.findFirst({
      orderBy: {
        lastTimeUsed: 'asc',
      },
    });

    const botForCreate = await this.steamBots.getBotForWorker('creator');

    if (!botForCreate) {
      this.logger.log('Бота для форума не нашлось =(');
      return this.prepareCloserCreate();
    }

    try {
      const topic = await botForCreate.createNewDiscussionTopic(
        record.app,
        text.title,
        text.message,
      );

      this.logger.log(
        `Бот #${botForCreate.id} | ${record.app} > <a href="https://steamcommunity.com/app/730/tradingforum/${topic.gidtopic}/">ссылка на форум</a>`,
      );

      await this.prisma.discusCreatorText.update({
        where: {
          id: text.id,
        },
        data: {
          lastTimeUsed: new Date(),
        },
      });

      await this.prisma.workerDiscusCreator.update({
        where: {
          id: record.id,
        },
        data: {
          lastCreatedAt: new Date(),
        },
      });
    } catch (e) {
      this.logger.error(e);
    }

    return this.prepareCloserCreate();
  }
}
