import { IsEmail, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;
  @IsString()
  password: string;
}
