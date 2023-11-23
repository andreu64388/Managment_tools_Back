import { IsInt, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  templateId: string;

  @IsString()
  title: string;

  @IsInt()
  duration: number;

  @IsString()
  descriptions: string;
}
