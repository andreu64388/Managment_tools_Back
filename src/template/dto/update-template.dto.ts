import { IsInt, IsString } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  name: string;
  @IsInt()
  templateId: number;
}
