import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { AddBumperTextDto } from './dto/add-bumper-text.dto';
import { DeleteBumperTextDto } from './dto/delete-bumper-text.dto';
import { UpdateBotWorkersDto } from './dto/update-bot-workers.dto';
import { AddBotDto } from './dto/add-bot.dto';
import { MyLogger } from './logger.service';
import { SteamBotService } from './steam-bot/steam-bot.service';
import { DiscussionBumperService } from './workers/discussion-bumper/discussion-bumper.service';
import { UpdateDiscussionIntervalDto } from './dto/update-discussion-interval.dto';
import { AddDiscussionBumperDto } from './dto/add-discussion-bumper.dto';
import { DiscussionCreatorService } from './workers/discussion-creator/discussion-creator.service';
import { AddCreatorTextDto } from './dto/add-creator-text.dto';
import { DeleteCreatorTextDto } from './dto/delete-creator-text.dto';
import { UpdateCreateIntervalDto } from './dto/update-create-interval.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly loggerService: MyLogger,
    private readonly steamBotService: SteamBotService,
    private readonly workerBumperService: DiscussionBumperService,
    private readonly workerDiscusCreator: DiscussionCreatorService,
  ) {}

  @Get()
  @Render('index')
  index() {
    return { logs: this.loggerService.getLogs() };
  }

  @Get('/bots')
  @Render('bots')
  async bots() {
    return { bots: await this.steamBotService.getAllBots() };
  }

  @Get('/worker-bumper')
  @Render('worker-bumper')
  async workerBumper() {
    return {
      text: await this.workerBumperService.getAllText(),
      discussions: await this.workerBumperService.getAllDiscussions(),
    };
  }

  @Get('/discus-creator')
  @Render('discus-creator')
  async discusCreator() {
    return {
      text: await this.workerDiscusCreator.getAllText(),
      forums: await this.workerDiscusCreator.getAllForums(),
    };
  }

  @Post('/creator/addText')
  async addCreatorText(@Body() data: AddCreatorTextDto) {
    return this.appService.addCreatorText(data);
  }

  @Post('/creator/deleteText')
  async deleteCreatorText(@Body() data: DeleteCreatorTextDto) {
    return this.appService.deleteCreatorText(data);
  }

  @Post('/bumper/updateInterval')
  async updateInterval(@Body() data: UpdateDiscussionIntervalDto) {
    return this.workerBumperService.updateDiscussionInterval(data);
  }

  @Post('/creator/updateInterval')
  async updateCreateInterval(@Body() data: UpdateCreateIntervalDto) {
    return this.workerDiscusCreator.updateCreateInterval(data);
  }

  @Post('/bumper/addDiscussion')
  async addDiscussion(@Body() data: AddDiscussionBumperDto) {
    return this.workerBumperService.addDiscussion(data.link);
  }

  @Post('/bumper/addText')
  async addBumperText(@Body() data: AddBumperTextDto) {
    return this.appService.addBumperText(data);
  }

  @Post('/bumper/deleteText')
  async deleteBumperText(@Body() data: DeleteBumperTextDto) {
    return this.appService.deleteBumperText(data);
  }

  @Post('/bot/updateWorkers')
  async updateBotWorkers(@Body() data: UpdateBotWorkersDto) {
    return this.steamBotService.updateBotWorkers(data);
  }

  @Post('/bot/add')
  async addNewBot(@Body() data: AddBotDto) {
    return this.steamBotService.addNewBot(data);
  }
}
