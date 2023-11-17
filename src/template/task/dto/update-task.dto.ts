import { IsInt, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsInt()
  taskId: number;

  @IsInt()
  templateId: number;

  @IsString()
  title: string;

  @IsInt()
  duration: number;

  @IsString()
  descriptions: string;
}
