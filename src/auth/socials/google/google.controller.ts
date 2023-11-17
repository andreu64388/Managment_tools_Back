import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleService } from './google.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;

    if (!user) {
      const loginFailedRedirect = this.configService.get<string>(
        'GOOGLE_LOGIN_FAILED_REDIRECT',
      );
      return res.redirect(loginFailedRedirect);
    }

    const token = await this.googleService.googleLogin(user);

    const redirectBaseUrl = this.configService.get<string>('BASE_URL');
    const authRedirect = this.configService.get<string>('GOOGLE_AUTH_REDIRECT');
    res.redirect(`${redirectBaseUrl}${authRedirect}/${token}`);
  }
}
