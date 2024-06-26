import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscussionBumperService } from './workers/discussion-bumper/discussion-bumper.service';
import { DiscussionCreatorService } from './workers/discussion-creator/discussion-creator.service';
import { GroupSpammerService } from './workers/group-spammer/group-spammer.service';
import { AddBumperTextDto } from './dto/add-bumper-text.dto';
import { PrismaService } from './prisma.service';
import { DeleteBumperTextDto } from './dto/delete-bumper-text.dto';
import { UpdateDiscussionIntervalDto } from './dto/update-discussion-interval.dto';
import { AddCreatorTextDto } from './dto/add-creator-text.dto';
import { DeleteCreatorTextDto } from './dto/delete-creator-text.dto';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly wDisBumper: DiscussionBumperService,
    private readonly wDisCreator: DiscussionCreatorService,
    private readonly wGroupSpammer: GroupSpammerService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    setTimeout(this.#startWorkers.bind(this), 2000);
  }

  async #startWorkers() {
    this.wDisBumper.init().then();
    this.wDisCreator.init().then();
    this.wGroupSpammer.init().then();
  }

  async addBumperText(data: AddBumperTextDto) {
    return this.prisma.discusBumperText.create({
      data,
    });
  }

  async addCreatorText(data: AddCreatorTextDto) {
    return this.prisma.discusCreatorText.create({
      data: {
        title: data.title,
        message: data.text,
      },
    });
  }

  async deleteCreatorText(data: DeleteCreatorTextDto) {
    try {
      await this.prisma.discusCreatorText.delete({
        where: {
          id: data.textId,
        },
      });
    } catch (e) {}
  }

  async deleteBumperText(data: DeleteBumperTextDto) {
    try {
      await this.prisma.discusBumperText.delete({
        where: {
          id: data.textId,
        },
      });
    } catch (e) {}
  }
}
