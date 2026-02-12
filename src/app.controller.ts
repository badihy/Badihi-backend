import { Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Deep link endpoint for email verification
   * This endpoint is called when user clicks verification link in email
   * Android App Links will intercept this and open in app if configured correctly
   * If opened in browser, it will process verification and show success message
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.authService.verifyEmail(token);
      
      // Return HTML response for browser, app will intercept before this
      return res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تم التحقق من البريد الإلكتروني</title>
          <style>
            body {
              font-family: 'Tajawal', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
            }
            h1 { color: #5e35b1; margin-bottom: 20px; }
            p { font-size: 18px; line-height: 1.6; }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>تم التحقق من البريد الإلكتروني بنجاح!</h1>
            <p>يمكنك الآن إغلاق هذه الصفحة والعودة إلى التطبيق.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>خطأ في التحقق</title>
          <style>
            body {
              font-family: 'Tajawal', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
            }
            h1 { color: #d32f2f; margin-bottom: 20px; }
            p { font-size: 18px; line-height: 1.6; }
            .error-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>فشل التحقق</h1>
            <p>الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط تحقق جديد.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  /**
   * Deep link endpoint for password reset
   * This endpoint shows a form for password reset if opened in browser
   * Android App Links will intercept this and open in app if configured correctly
   */
  @Get('reset-password')
  async showResetPasswordForm(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>خطأ</title>
          <style>
            body {
              font-family: 'Tajawal', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
            }
            h1 { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>الرابط غير صالح</h1>
            <p>يرجى استخدام الرابط الموجود في البريد الإلكتروني.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Return HTML form for browser, app will intercept before this
    return res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
        <style>
          body {
            font-family: 'Tajawal', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
            width: 100%;
          }
          h1 {
            color: #5e35b1;
            text-align: center;
            margin-bottom: 30px;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          input {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            font-family: 'Tajawal', sans-serif;
          }
          input:focus {
            outline: none;
            border-color: #5e35b1;
          }
          button {
            background-color: #5e35b1;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Tajawal', sans-serif;
          }
          button:hover {
            background-color: #4527a0;
          }
          .message {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
          }
          .message.success {
            background-color: #4caf50;
            color: white;
            display: block;
          }
          .message.error {
            background-color: #f44336;
            color: white;
            display: block;
          }
          .info {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>إعادة تعيين كلمة المرور</h1>
          <div id="message" class="message"></div>
          <form id="resetForm" onsubmit="handleSubmit(event)">
            <input type="hidden" id="token" value="${token}">
            <input type="password" id="newPassword" placeholder="كلمة المرور الجديدة" required>
            <input type="password" id="confirmPassword" placeholder="تأكيد كلمة المرور" required>
            <button type="submit">إعادة تعيين</button>
          </form>
          <p class="info">إذا كنت تستخدم التطبيق، سيتم فتح التطبيق تلقائياً.</p>
        </div>
        <script>
          async function handleSubmit(event) {
            event.preventDefault();
            const token = document.getElementById('token').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            
            if (newPassword !== confirmPassword) {
              messageDiv.className = 'message error';
              messageDiv.textContent = 'كلمات المرور غير متطابقة';
              return;
            }
            
            try {
              const response = await fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: token,
                  newPassword: newPassword,
                  confirmNewPassword: confirmPassword
                })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                messageDiv.className = 'message success';
                messageDiv.textContent = 'تم إعادة تعيين كلمة المرور بنجاح!';
                document.getElementById('resetForm').reset();
              } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.message || 'حدث خطأ ما';
              }
            } catch (error) {
              messageDiv.className = 'message error';
              messageDiv.textContent = 'حدث خطأ في الاتصال';
            }
          }
        </script>
      </body>
      </html>
    `);
  }
}
