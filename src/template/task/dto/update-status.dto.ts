import { IsInt, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsInt()
  planId: number;

  @IsInt()
  taskId: number;
}
