import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class AddCreatorTextDto {
  @IsString()
  @Type(() => String)
  text: string;

  @IsString()
  @Type(() => String)
  title: string;
}
