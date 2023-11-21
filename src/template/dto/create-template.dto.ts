import { IsString, IsInt } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsInt()
  prepTime: number;

  @IsInt()
  idealPreReq: number;

  @IsInt()
  duration: number;
}
