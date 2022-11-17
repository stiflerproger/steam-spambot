import SteamCommunity from 'steamcommunity';

export class CDiscussion {
  constructor(
    private options: {
      community: SteamCommunity;
      forumData: Record<string, any>;
      sessionId: string;
    },
  ) {}
  /** Пишем текст на форуме, если у нас есть доступ */
  async postComment(comment) {
    return new Promise(async (res, rej) => {
      this.options.community.httpRequestPost(
        {
          uri: `https://steamcommunity.com/comment/ForumTopic/post/${this.options.forumData.owner}/${this.options.forumData.feature}/`,
          form: {
            comment,
            sessionid: this.options.sessionId,
            extended_data: this.options.forumData.extended_data,
            feature2: this.options.forumData.feature2,
          },
        },
        (err, response, body) => {
          body = JSON.parse(body);

          if (!body.success || body.error) {
            return rej(body.error || 'Ошибка отправки бампа');
          }

          return res(true);
        },
      );
    });
  }
}
