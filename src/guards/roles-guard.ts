import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from 'src/auth/token/token.service';
import { ROLES_KEY } from 'src/decorator/roles.decorator';
import { ApiError } from 'src/exceptions/ApiError.exception';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    try {
      if (!requiredRoles) {
        return true;
      }
      if (token) {
        const user = await this.findUserByToken(token);

        if (user) {
          const hasRequiredRoles = requiredRoles.every((requiredRole) =>
            user.roles.some((userRole) => userRole.name === requiredRole),
          );

          if (hasRequiredRoles) {
            request.user = user;
            return true;
          }
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
      const decodedToken = this.tokenService.getEmailFromToken(token);

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
