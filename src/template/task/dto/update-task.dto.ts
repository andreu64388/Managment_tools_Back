import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  taskId: string;

  @IsString()
  templateId: string;

  @IsString()
  title: string;

  duration: number;

  @IsString()
  descriptions: string;

  @IsOptional()
  video: string[] | null;
}
