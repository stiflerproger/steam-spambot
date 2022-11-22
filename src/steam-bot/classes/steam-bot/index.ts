import * as SteamCommunity from 'steamcommunity';
import * as request from 'request';
import { promisify } from 'util';
import * as SteamTotp from 'steam-totp';
import { sleep } from '../../../utils/sleep';
import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import CSteamGroup from 'steamcommunity/classes/CSteamGroup';
import { CDiscussion } from './lib/discussion';

interface Options {
  id: number;
  login: string;
  password: string;
  proxyUrl: string;
  sharedSecret: string;
  cookies?: string | string[];
}

export default class SteamBot extends EventEmitter {
  public id: number;
  readonly #community: SteamCommunity;
  #options: Options;
  private readonly request: any;

  logger: Logger;

  constructor(options: Options) {
    super();
    this.#options = options;
    this.id = options.id;

    this.logger = new Logger('SteamBot_' + options.id);

    if (this.#options.cookies && typeof this.#options.cookies === 'string') {
      this.#options.cookies = JSON.parse(this.#options.cookies);
    }

    this.request = request.defaults({
      proxy: this.#options.proxyUrl,
    });

    this.#community = new SteamCommunity({
      request: this.request,
      timeout: 50000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      localAddress: this.#options.proxyUrl,
    });
  }

  #loginInitiated = false;

  public async login(force = false, attempts?: number) {
    if (this.#loginInitiated) {
      throw new Error('Логин уже инициирован!');
    }

    this.#loginInitiated = true;

    while (true) {
      try {
        await this.loginToSteam(force);
        break;
      } catch (e) {
        if (typeof attempts === 'number') {
          attempts--;

          if (attempts <= 0) {
            throw new Error(
              `Не удалось авторизоваться ботом: ${
                this.#options.login
              } | ${String(e)}`,
            );
          }
        }

        this.logger.error(`Ошибка логина. Пробуем снова через 1мин..`);
        await sleep(60000);
      }
    }

    this.#loginInitiated = false;
  }

  private loginToSteam(force = false) {
    return new Promise(async (resolve, reject) => {
      if (!force && this.#options.cookies?.length) {
        this.#community.setCookies(this.#options.cookies as string[]);

        const isLogged = await promisify(this.#community.loggedIn).call(
          this.#community,
        );

        if (isLogged) {
          return resolve(true);
        }
      }

      this.#options.cookies = [];

      this.#community.login(
        {
          accountName: this.#options.login,
          password: this.#options.password,
          twoFactorCode: SteamTotp.getAuthCode(this.#options.sharedSecret),
        },
        async (err, sessionID, cookies, steamguard) => {
          if (err) {
            this.logger.log('Ошибка логина: ' + err.message);
            return reject(err);
          }

          this.logger.log('Куки не подошли, новая сессия');

          this.#options.cookies = cookies;

          this.emit(
            'cookies',
            this.#options.id,
            this.#community.steamID.getSteamID64(),
            cookies,
          );

          return resolve(true);
        },
      );
    });
  }

  private async getDiscussion(
    groupId: string,
    forumId: string,
    discusId: string,
  ): Promise<CDiscussion> {
    return new Promise((res, rej) => {
      this.#community.httpRequestGet(
        `https://steamcommunity.com/groups/${groupId}/discussions/${forumId}/${discusId}/`,
        (err, response, body) => {
          if (err) return rej(err);

          const match = body.match(/(InitializeCommentThread.+\));\W+}/)?.[1];

          if (!match) return rej('На нашел данных по обсуждению');

          const forumData = eval(match);

          const sessionId = body.match(/g_sessionID = "(\S+)"/)?.[1];

          forumData.forumTitle = body.match(/<title>(.+)::/)?.[1];

          return res(
            new CDiscussion({
              community: this.#community,
              forumData,
              sessionId,
            }),
          );
        },
      );
    });
  }

  /** Написать текст от имени бота в выбранной теме */
  public async writeCommentInDiscussion(
    groupId: string,
    forumId: string,
    discusId: string,
    comment: string,
  ) {
    const group: CSteamGroup = await promisify(
      this.#community.getSteamGroup.bind(this.#community),
    )(groupId);

    try {
      await promisify(group.join.bind(group))(); // присоединяется к группе, чтобы была возможность писать
    } catch (e) {
      if (e.message.indexOf('already a member') === -1) throw e;
    }

    const discussion = await this.getDiscussion(groupId, forumId, discusId);

    await discussion.postComment(comment);

    return {
      discussionTitle: group.name,
      forumTitle: discussion.getTitle(),
    };
  }
}

function InitializeCommentThread(...args) {
  if (typeof args[2] !== 'object') return {};

  const data = args[2];

  data.extended_data_parsed = JSON.parse(data.extended_data);

  return data;
}
