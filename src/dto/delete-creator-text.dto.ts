import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class DeleteCreatorTextDto {
  @IsInt()
  @Type(() => Number)
  textId: number;
}
