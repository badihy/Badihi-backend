import { Body, Controller, Post, UseGuards, Get, Request, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FirebaseGuard } from './guards/firebase.guard';
import { TokenResponseDto } from './dto/token-response.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiOkResponse({
    description: 'Successfully authenticated with Google',
    type: TokenResponseDto,
  })
  async googleAuthCallback(@Req() req: any): Promise<TokenResponseDto> {
    return this.authService.issueTokenPairForUser(req.user);
  }

  @Post('google/id-token')
  @UseGuards(FirebaseGuard)
  @ApiOperation({ summary: 'Login/Register with Google ID token (mobile)' })
  @ApiOkResponse({
    description: 'Successfully authenticated with Google ID token',
    type: TokenResponseDto,
  })
  async googleIdToken(@Req() req: any): Promise<TokenResponseDto> {
    const authUser = req.user;
    const [firstName, ...lastNameParts] = (authUser.name || '').split(' ');

    const user = await this.authService.validateOAuthUser(
      {
        email: authUser.email,
        firstName,
        lastName: lastNameParts.join(' '),
        picture: authUser.picture,
        providerId: authUser.uid,
      },
      'google',
    );

    return this.authService.generateTokens(user);
  }

  @ApiBearerAuth('JWT-refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('refresh')
  refreshTokens(@Request() req) {
    const userId = req.user?.id ?? req.user?.sub;
    const refreshToken = req.user?.refreshToken;
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
