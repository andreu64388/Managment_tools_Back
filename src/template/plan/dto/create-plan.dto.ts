import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePlanDto {
  @IsInt()
  templateId: number;

  @IsNotEmpty({ message: 'Deadline cannot be empty' })
  deadline: string;
}
