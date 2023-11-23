import { IsNotEmpty } from 'class-validator';

export class GetTaskDto {
  @IsNotEmpty()
  planId: string;

  @IsNotEmpty()
  taskId: string;
}
