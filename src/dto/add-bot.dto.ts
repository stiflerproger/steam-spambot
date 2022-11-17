import { IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AddBotDto {
  @IsString()
  @Type(() => String)
  login: string;

  @IsString()
  @Type(() => String)
  password: string;

  @IsString()
  @Type(() => String)
  sharedSecret: string;

  @IsString()
  @Type(() => String)
  @Transform((proxyUrl) => {
    try {
      new URL(proxyUrl.value);
    } catch (e) {
      throw new Error('Не валидный прокси! ' + proxyUrl.value);
    }

    return proxyUrl.value;
  })
  proxyUrl: string;
}
