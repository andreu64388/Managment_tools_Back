import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  templateId: string;

  @IsNotEmpty({ message: 'Deadline cannot be empty' })
  deadline: string;
}
