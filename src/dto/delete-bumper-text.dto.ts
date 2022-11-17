import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class DeleteBumperTextDto {
  @IsInt()
  @Type(() => Number)
  textId: number;
}
