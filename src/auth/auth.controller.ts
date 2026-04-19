import { Body, Controller, Post, UseGuards, Get, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenResponseDto } from './dto/token-response.dto';
import { MobileGoogleSignInDto } from './dto/mobile-google-sign-in.dto';
import { MobileGoogleAuthCodeDto } from './dto/mobile-google-auth-code.dto';

@Public()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

  @Post('mobile')
  @ApiOperation({ summary: 'Google Sign-In for mobile (Android/iOS)' })
  @ApiBody({ type: MobileGoogleSignInDto })
  @ApiOkResponse({
    description: 'Successfully authenticated with mobile ID token',
    type: TokenResponseDto,
  })
  async googleSignInMobile(@Body() body: MobileGoogleSignInDto): Promise<TokenResponseDto> {
    return this.authService.googleSignInMobile(body.idToken);
  }

  @Post('mobile/auth-code')
  @ApiOperation({ summary: 'Google Sign-In for mobile using server auth code' })
  @ApiBody({ type: MobileGoogleAuthCodeDto })
  @ApiOkResponse({
    description: 'Successfully authenticated after exchanging the mobile server auth code',
    type: TokenResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The Google auth code is invalid, expired, or cannot be exchanged',
  })
  async googleSignInMobileWithAuthCode(
    @Body() body: MobileGoogleAuthCodeDto,
  ): Promise<TokenResponseDto> {
    return this.authService.googleSignInMobileWithAuthCode(body.serverAuthCode);
  }

  @Post('mobile/auth-code/test')
  @ApiOperation({ summary: 'Temporary alias for the mobile server auth code flow' })
  @ApiBody({ type: MobileGoogleAuthCodeDto })
  @ApiOkResponse({
    description: 'Successfully authenticated after exchanging the mobile server auth code',
    type: TokenResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The Google auth code is invalid, expired, or cannot be exchanged',
  })
  async googleSignInMobileWithAuthCodeTestAlias(
    @Body() body: MobileGoogleAuthCodeDto,
  ): Promise<TokenResponseDto> {
    return this.authService.googleSignInMobileWithAuthCode(body.serverAuthCode);
  }
}
