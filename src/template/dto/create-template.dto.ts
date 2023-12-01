import { IsString, IsInt, isString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsInt()
  prepTime: number;

  @IsString()
  idealPreReq: string;

  @IsInt()
  duration: number;
}
