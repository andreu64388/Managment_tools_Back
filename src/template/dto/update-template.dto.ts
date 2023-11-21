import { IsInt, IsString } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  name: string;
  @IsInt()
  templateId: number;

  @IsInt()
  prepTime: number;

  @IsInt()
  idealPreReq: number;

  @IsInt()
  duration: number;
}
