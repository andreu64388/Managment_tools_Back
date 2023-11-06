import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './../user/user.service';
import { MailService } from 'src/mail/mail.service';
import { PasswordService } from './password/password.service';
import { TokenService } from './token/token.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async register(user: RegisterUserDto) {
    const { password, email } = user;
    const isUserExist = await this.userService.findByEmail(email);

    if (isUserExist) {
      return { message: 'User already exist' };
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
      return { message: 'User not found' };
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      isUserExist.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = await this.tokenService.generateToken(email);

    return { user: isUserExist, token };
  }

  private resetLinkLastSent: Record<string, number> = {};
  private readonly resetLinkCooldown = 300000;

  async forgot(email: string) {
    const currentTime = Date.now();

    if (
      this.resetLinkLastSent[email] &&
      currentTime - this.resetLinkLastSent[email] < this.resetLinkCooldown
    ) {
      return 'Слишком частые запросы на сброс пароля. Подождите 5 минут.';
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      return 'Недействительный запрос на сброс пароля';
    }

    const token = await this.tokenService.generateToken(email, '5m');
    this.resetLinkLastSent[email] = currentTime;

    await this.mailService.sendUserConfirmation(user, token);
    await this.tokenService.saveToken(token, user.id);

    return { message: 'Проверьте свою почту' };
  }

  async reset(id: number, token: string, password: string) {
    token = token.replace(/\+/g, '.');
    const email = this.tokenService.getEmailFromToken(token);
    const user = await this.userService.findById(id);
    const rightsToAccess = await this.checkValidateToken(user.id, token);

    if (rightsToAccess && user.email === email) {
      const hashedPassword =
        await this.passwordService.generatePassword(password);
      const updatedUser = await this.userService.updatePassword(
        user.id,
        hashedPassword,
      );

      if (updatedUser) {
        await this.tokenService.removeToken(token, user.id);
        return { user: updatedUser };
      } else {
        throw new UnauthorizedException('Failed to update the user.');
      }
    } else {
      throw new UnauthorizedException('Недействительный или истекший токен.');
    }
  }

  async checkValidateToken(id: number, token: string) {
    try {
      token = token.replace(/\+/g, '.');
      const email = await this.tokenService.getEmailFromToken(token);
      const user = await this.userService.findById(id);
      const rightsToAccess = await this.tokenService.accsessToken(
        token,
        user.id,
      );

      if (rightsToAccess && user.email === email) {
        return { message: 'Токен действителен.' };
      } else {
        throw new UnauthorizedException('Недействительный или истекший токен.');
      }
    } catch (error) {
      throw new UnauthorizedException('Недействительный или истекший токен.');
    }
  }
}
