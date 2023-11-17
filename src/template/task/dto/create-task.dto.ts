import { IsInt, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsInt()
  templateId: number;

  @IsString()
  title: string;

  @IsInt()
  duration: number;

  @IsString()
  descriptions: string;
}
