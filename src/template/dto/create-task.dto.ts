import { IsNumber, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  readonly title: string;

  @IsNumber()
  readonly templateId: number;
}
