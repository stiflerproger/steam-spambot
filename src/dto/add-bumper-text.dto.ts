import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class AddBumperTextDto {
  @IsString()
  @Type(() => String)
  text: string;
}
