import { HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from './../user/user.service';
import { PasswordService } from './password/password.service';
import { TokenService } from './token/token.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiError } from 'src/exceptions/ApiError.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  async register(user: RegisterUserDto) {
    const { password, email } = user;
    const isUserExist = await this.userService.findByEmail(email);

    if (isUserExist) {
      throw new ApiError(
        'User with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword =
      await this.passwordService.generatePassword(password);
    const newUser = { ...user, password: hashedPassword };
    const createUser = await this.userService.create(newUser);
    const token = await this.tokenService.generateToken(email);

    return { user: createUser, token };
  }

  async login(user: LoginUserDto) {
    const { email, password } = user;
    const isUserExist = await this.userService.findByEmail(email);

    if (!isUserExist) {
      throw new ApiError('User not found', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      isUserExist.password,
    );

    if (!isPasswordValid) {
      throw new ApiError('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.tokenService.generateToken(email);

    return { user: isUserExist, token };
  }
}
