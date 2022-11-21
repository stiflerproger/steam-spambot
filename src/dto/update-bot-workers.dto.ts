import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsString } from 'class-validator';

export class UpdateBotWorkersDto {
  @IsInt()
  @Type(() => Number)
  botId: number;

  @IsBoolean()
  @Type(() => Boolean)
  bumper: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  creator: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  spammer: boolean;
}
