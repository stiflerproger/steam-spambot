import { Type } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class UpdateBotWorkersDto {
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
