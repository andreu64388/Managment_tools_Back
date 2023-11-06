import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FogrotService } from './forgot.service';
@Controller('forgot')
export class ForgotController {
  constructor(private forgotService: FogrotService) {}

  @Post()
  async forgotPassword(@Body() req: { email: string }) {
    console.log(req?.email);
    return this.forgotService.forgot(req.email);
  }

  @Get('reset/:id/:token')
  async resetPassword(@Param('id') id: number, @Param('token') token: string) {
    return this.forgotService.checkValidateToken(id, token);
  }
  @Post('reset/:id/:token')
  async resetPassword2(
    @Param('id') id: number,
    @Param('token') token: string,
    @Body() body: any,
  ) {
    const password = body.password;
    return this.forgotService.reset(id, token, password);
  }
}
