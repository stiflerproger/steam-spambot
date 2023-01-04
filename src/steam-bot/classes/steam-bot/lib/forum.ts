import SteamCommunity from 'steamcommunity';

export class CForum {
  constructor(
    private options: {
      community: SteamCommunity;
      forumData: Record<string, any>;
      sessionId: string;
    },
  ) {}

  getTitle() {
    return this.options.forumData.forumTitle as string;
  }

  /** Пишем текст на форуме, если у нас есть доступ */
  async createTopic(
    title: string,
    message: string,
  ): Promise<{ success: 1; gidtopic: string; topic_url: string }> {
    return new Promise(async (res, rej) => {
      this.options.community.httpRequestPost(
        {
          uri: `https://steamcommunity.com/forum/${
            this.options.forumData.owner
          }/${this.options.forumData.type.toLowerCase()}/createtopic/${
            this.options.forumData.feature
          }/`,
          form: {
            appid: this.options.forumData.appid,
            sessionid: this.options.sessionId,
            topic: title,
            text: message,
            subforum: `${this.options.forumData.type}/${this.options.forumData.feature}`,
          },
        },
        (err, response, body) => {
          body = JSON.parse(body);

          if (!body.success || body.error) {
            return rej(body.error || 'Ошибка создания форума');
          }

          // console.log(body); // { success: 1, gidtopic: '3730702146118603819', topic_url: '' }

          return res(body);
        },
      );
    });
  }
}
