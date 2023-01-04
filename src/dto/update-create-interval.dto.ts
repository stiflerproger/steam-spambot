import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UpdateCreateIntervalDto {
  @IsInt()
  @Type(() => Number)
  id: number;

  @IsInt()
  @Type(() => Number)
  createInterval: number;
}
