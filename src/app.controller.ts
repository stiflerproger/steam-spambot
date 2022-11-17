import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AddBumperTextDto } from './dto/add-bumper-text.dto';
import { DeleteBumperTextDto } from './dto/delete-bumper-text.dto';
import { UpdateBotWorkersDto } from './dto/update-bot-workers.dto';
import { AddBotDto } from './dto/add-bot.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/bumper/getText')
  async getBumperText() {
    return this.appService.getBumperText();
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
  async updateBotWorkers(@Body() data: UpdateBotWorkersDto) {}

  @Post('/bot/add')
  async addNewBot(@Body() data: AddBotDto) {}
}
