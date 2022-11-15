import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscussionBumperService } from './workers/discussion-bumper/discussion-bumper.service';
import { DiscussionCreatorService } from './workers/discussion-creator/discussion-creator.service';
import { GroupSpammerService } from './workers/group-spammer/group-spammer.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly wDisBumper: DiscussionBumperService,
    private readonly wDisCreator: DiscussionCreatorService,
    private readonly wGroupSpammer: GroupSpammerService,
  ) {}

  async onModuleInit() {
    setTimeout(this.#startWorkers.bind(this), 2000);
  }

  async #startWorkers() {
    this.wDisBumper.init().then();
    this.wDisCreator.init().then();
    this.wGroupSpammer.init().then();
  }
}
