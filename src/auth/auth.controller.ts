import { Body, Controller, Post, UseGuards, Get, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('firebase-login')
  async loginWithFirebase(@Body() firebaseLoginDto: FirebaseLoginDto) {
    return this.authService.loginWithFirebase(firebaseLoginDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('refresh')
  refreshTokens(@Request() req) {
    const userId = req.user['id'];
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
