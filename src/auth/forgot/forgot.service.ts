import { HttpStatus, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { PasswordService } from '../password/password.service';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { KindAuth } from '../kind.enum';

@Injectable()
export class FogrotService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly passwordService: PasswordService,
  ) {}

  private resetLinkLastSent: Record<string, number> = {};
  private readonly resetLinkCooldown = 300000;

  async forgot(email: string) {
    const currentTime = Date.now();
    if (
      this.resetLinkLastSent[email] &&
      currentTime - this.resetLinkLastSent[email] < this.resetLinkCooldown
    ) {
      throw new ApiError(
        "You've already sent a reset link. Please wait a bit.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new ApiError(
        'User with this email does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.kindAuth && user?.kindAuth === KindAuth.LOCAL) {
      const token = await this.tokenService.generateToken(email, '5m');
      this.resetLinkLastSent[email] = currentTime;

      await this.mailService.sendUserConfirmation(user, token);
      await this.tokenService.saveToken(token, user.id);

      return { message: 'Check your email' };
    } else {
      throw new ApiError(
        'User with this email does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async reset(token: string, password: string) {
    try {
      token = token.replace(/\+/g, '.');
      const user = this.tokenService.getEmailFromToken(token);
      const rightsToAccess = await this.checkValidateToken(token);

      if (rightsToAccess && user) {
        const hashedPassword =
          await this.passwordService.generatePassword(password);
        const updatedUser = await this.userService.updatePassword(
          user.id,
          hashedPassword,
        );

        if (updatedUser) {
          await this.tokenService.removeToken(token);
          return { user: updatedUser };
        } else {
          throw new ApiError(
            'Failed to update the user.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      } else {
        throw new ApiError(
          'Token is invalid or expired.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (e) {
      throw new ApiError(
        'Token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async checkValidateToken(token: string) {
    try {
      token = token.replace(/\+/g, '.');
      const email = await this.tokenService.getEmailFromToken(token);
      const rightsToAccess = await this.tokenService.accsessToken(token);

      if (rightsToAccess && email) {
        return { message: 'Token is valid' };
      } else {
        throw new ApiError('Token is not valid', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      throw new ApiError('Token is not valid', HttpStatus.UNAUTHORIZED);
    }
  }
}
