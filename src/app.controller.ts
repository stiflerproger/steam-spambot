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

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly loggerService: MyLogger,
    private readonly steamBotService: SteamBotService,
    private readonly workerBumperService: DiscussionBumperService,
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

  @Post('/bumper/updateInterval')
  async updateInterval(@Body() data: UpdateDiscussionIntervalDto) {
    return this.workerBumperService.updateDiscussionInterval(data);
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
