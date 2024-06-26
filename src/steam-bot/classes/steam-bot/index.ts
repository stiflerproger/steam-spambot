import * as SteamCommunity from 'steamcommunity';
import * as request from 'request';
import {promisify} from 'util';
import * as SteamTotp from 'steam-totp';
import {sleep} from '../../../utils/sleep';
import {EventEmitter} from 'events';
import {Logger} from '@nestjs/common';
import CSteamGroup from 'steamcommunity/classes/CSteamGroup';
import {CDiscussion} from './lib/discussion';
import * as CatchHandler from 'catch-decorator';
import {CForum} from './lib/forum';
import {EAuthTokenPlatformType, LoginSession} from "steam-session";

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
  #session: LoginSession;
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

    this.logger.log(`Логин...${this.#options.login}`);

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
        console.error(e);
        await sleep(60000);
      }
    }

    this.logger.log(`Залогинен!...${this.#options.login}`);

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

      this.#session = new LoginSession(EAuthTokenPlatformType.WebBrowser, {
        httpProxy: this.#options.proxyUrl,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      });

      this.#session.startWithCredentials({
        accountName: this.#options.login,
        password: this.#options.password,
        steamGuardCode: SteamTotp.getAuthCode(this.#options.sharedSecret),
      })
        .then((response) => {
          this.logger.log('Ожидаю события авторизации..');

          this.#session.once('authenticated', async () => {
            const cookies = await this.#session.getWebCookies();

            this.logger.log('Получил новые куки!');

            this.#options.cookies = cookies;

            this.#community.setCookies(cookies);

            this.emit(
              'cookies',
              this.#options.id,
              this.#community.steamID.getSteamID64(),
              cookies,
            );

            return resolve(true);
          });

        })
        .catch(e => {
          return reject(e);
        });

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

  private async getForum(app: string, forum: string): Promise<CForum> {
    return new Promise((res, rej) => {
      this.#community.httpRequestGet(
        `https://steamcommunity.com/app/${app}/${forum}/`,
        (err, response, body) => {
          if (err) return rej(err);

          const match = body.match(/(InitializeForum.+\));\W+}/)?.[1];

          if (!match) return rej('На нашел данных по форуму');

          const forumData = eval(match);

          const sessionId = body.match(/g_sessionID = "(\S+)"/)?.[1];

          forumData.forumTitle = body.match(/<title>(.+)::/)?.[1];

          return res(
            new CForum({
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
  // @ts-ignore
  @CatchHandler(Error, SteamBot.loginHandler)
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
      comment,
    };
  }

  static loginHandler(error: any, ctx: SteamBot) {
    if (error?.message !== 'Not Logged In') throw error;
    ctx.login().then(); // отправляем бота на релогин
    throw error;
  }

  async createNewDiscussionTopic(app: string, title: string, message: string) {
    const forum = await this.getForum(app, 'tradingforum');

    return await forum.createTopic(title, message);
  }
}

function InitializeCommentThread(...args) {
  if (typeof args[2] !== 'object') return {};

  const data = args[2];

  data.extended_data_parsed = JSON.parse(data.extended_data);

  return data;
}

function InitializeForum(...args) {
  if (typeof args[1] !== 'object') return {};

  const data = args[1];

  return data;
}
