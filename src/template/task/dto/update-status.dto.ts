import { IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  planId: string;

  @IsString()
  taskId: string;
}
