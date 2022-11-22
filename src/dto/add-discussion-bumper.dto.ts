import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class AddDiscussionBumperDto {
  @IsString()
  @Type(() => String)
  link: string;
}
