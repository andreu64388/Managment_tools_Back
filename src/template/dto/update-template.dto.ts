import { IsInt, IsString } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  templateId: string;

  @IsInt()
  prepTime: number;

  @IsString()
  idealPreReq: string;
}
