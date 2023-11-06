import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;
  @IsString()
  password: string;
}
