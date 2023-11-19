import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenService } from 'src/auth/token/token.service';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokemService: TokenService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    try {
      if (token) {
        const user = await this.findUserByToken(token);
        if (user) {
          request.user = user;
          return true;
        }
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  private extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private async findUserByToken(token: string) {
    try {
      const decodedToken = this.tokemService.getEmailFromToken(token);
      if (!decodedToken) {
        throw new ApiError('Invalid token', 401);
      }
      const user = await this.userService.findByEmail(decodedToken);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
