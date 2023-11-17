import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class GetTaskDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  planId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  taskId: number;
}
