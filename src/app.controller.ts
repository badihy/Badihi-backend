import { Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { Public } from './auth/decorators/public.decorator';
import type { Response } from 'express';
import {
  getInvalidResetPasswordLinkPage,
  getResetPasswordPage,
  getVerifyEmailErrorPage,
  getVerifyEmailSuccessPage,
} from './common/templates/deep-link-pages.template';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('.well-known/assetlinks.json')
  getAndroidAssetLinks(@Res() res: Response) {
    return res
      .type('application/json')
      .set('Cache-Control', 'public, max-age=3600')
      .send([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.badihi.app',
            sha256_cert_fingerprints: [
              '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5',
            ],
          },
        },
      ]);
  }

  @Public()
  @Get('.well-known/apple-app-site-association')
  getAppleAppSiteAssociation(@Res() res: Response) {
    return res
      .type('application/json')
      .set('Cache-Control', 'public, max-age=3600')
      .send({
        applinks: {
          apps: [],
          details: [
            {
              appID: 'TeamID.com.badihi.app',
              paths: [
                '/verify-email',
                '/verify-email/*',
                '/reset-password',
                '/reset-password/*',
              ],
            },
          ],
        },
      });
  }

  /**
   * Deep link endpoint for email verification
   * This endpoint is called when user clicks verification link in email
   * Android App Links will intercept this and open in app if configured correctly
   * If opened in browser, it will process verification and show success message
   */
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.authService.verifyEmail(token);
      return res.send(getVerifyEmailSuccessPage());
    } catch {
      return res.status(400).send(getVerifyEmailErrorPage());
    }
  }

  /**
   * Deep link endpoint for password reset
   * This endpoint shows a form for password reset if opened in browser
   * Android App Links will intercept this and open in app if configured correctly
   */
  @Public()
  @Get('reset-password')
  async showResetPasswordForm(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).send(getInvalidResetPasswordLinkPage());
    }

    return res.send(getResetPasswordPage(token));
  }
}
