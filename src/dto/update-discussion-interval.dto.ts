import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UpdateDiscussionIntervalDto {
  @IsInt()
  @Type(() => Number)
  id: number;

  @IsInt()
  @Type(() => Number)
  bumpInterval: number;
}
