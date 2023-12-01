import { IsInt, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  taskId: string;

  @IsString()
  templateId: string;

  @IsString()
  title: string;

  @IsInt()
  duration: number;

  @IsString()
  descriptions: string;
  
}
