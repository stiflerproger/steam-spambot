import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { AddBumperTextDto } from './dto/add-bumper-text.dto';
import { DeleteBumperTextDto } from './dto/delete-bumper-text.dto';
import { UpdateBotWorkersDto } from './dto/update-bot-workers.dto';
import { AddBotDto } from './dto/add-bot.dto';
import { MyLogger } from './logger.service';
import { SteamBotService } from './steam-bot/steam-bot.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly loggerService: MyLogger,
    private readonly steamBotService: SteamBotService,
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

  @Get('/bumper/getText')
  async getBumperText() {
    return this.appService.getBumperText();
  }

  @Post('/bumper/addText')
  async addBumperText(@Body() data: AddBumperTextDto) {
    return this.appService.addBumperText(data['data']);
  }

  @Post('/bumper/deleteText')
  async deleteBumperText(@Body() data: DeleteBumperTextDto) {
    return this.appService.deleteBumperText(data['data']);
  }

  @Post('/bot/updateWorkers')
  async updateBotWorkers(@Body() data: UpdateBotWorkersDto) {
    return this.steamBotService.updateBotWorkers(data['data']);
  }

  @Post('/bot/add')
  async addNewBot(@Body() data: AddBotDto) {}
}
