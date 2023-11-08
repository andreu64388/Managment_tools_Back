import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FogrotService } from './forgot.service';
@Controller('forgot')
export class ForgotController {
  constructor(private forgotService: FogrotService) {}

  @Post()
  async forgotPassword(@Body() req: { email: string }) {
    return this.forgotService.forgot(req.email);
  }

  @Get('reset/:token')
  async resetPassword(@Param('token') token: string) {
    return this.forgotService.checkValidateToken(token);
  }

  @Post('reset/:token')
  async resetPassword2(@Param('token') token: string, @Body() body: any) {
    const password = body.password;
    console.log(password);
    console.log(token);
    return this.forgotService.reset(token, password);
  }
}
