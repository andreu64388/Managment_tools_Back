import { IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  readonly name: string;
}
