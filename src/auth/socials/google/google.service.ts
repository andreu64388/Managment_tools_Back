import { Injectable } from '@nestjs/common';
import { KindAuth } from 'src/auth/kind.enum';
import { TokenService } from 'src/auth/token/token.service';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async googleLogin(googleUser) {
    try {
      if (!googleUser) {
        return {
          message: 'No user from google',
        };
      }

      const { email } = googleUser;
      const user = await this.userService.findByEmail(email);

      let newUser;
      if (!user)
        newUser = await this.userService.createService(email, KindAuth.GOOGLE);

      const token = this.tokenService.generateToken(email);
      return token;
    } catch (e) {
      throw new ApiError('Failed to send email', 500);
    }
  }
}
