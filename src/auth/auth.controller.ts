import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TokenResponseDto } from './dto/token-response.dto';

@Public()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return this.authService.issueTokensFromOAuthGuardPayload(req.user);
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
  async googleSignInMobile(
    @Body() body: MobileGoogleSignInDto,
  ): Promise<TokenResponseDto> {
    return this.authService.googleSignInMobile(body.idToken);
  }
}
