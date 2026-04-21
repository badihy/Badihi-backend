export const getResetPasswordEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور - بديهي</title>
    <style>
        table { border-spacing: 0; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        @media only screen and (max-width: 600px) {
            .outer-padding { padding: 0 18px 32px !important; }
            .brand-cell { padding: 18px 4px 18px !important; }
            .hero-wrap { padding: 0 4px 30px !important; }
            .hero-cell { padding: 58px 0 !important; }
            .content-cell { padding: 0 8px !important; }
            .button-cell { padding: 0 8px 32px !important; }
            .footer-wrap { padding: 0 8px !important; }
        }
        @media only screen and (max-width: 480px) {
            .outer-padding { padding: 0 14px 28px !important; }
            .brand-cell { padding: 16px 2px 18px !important; }
            .hero-wrap { padding: 0 2px 28px !important; }
            .hero-cell { padding: 48px 0 !important; }
            .hero-logo { width: 118px !important; max-width: 118px !important; }
            .title { font-size: 23px !important; line-height: 1.45 !important; margin-bottom: 20px !important; }
            .body-copy { font-size: 14px !important; line-height: 1.9 !important; margin-bottom: 16px !important; }
            .footer-copy { font-size: 12px !important; line-height: 1.8 !important; text-align: right !important; }
        }
        @media only screen and (max-width: 360px) {
            .outer-padding { padding-left: 10px !important; padding-right: 10px !important; }
            .hero-cell { padding: 40px 0 !important; }
            .hero-logo { width: 104px !important; max-width: 104px !important; }
            .title { font-size: 21px !important; }
            .body-copy { font-size: 13px !important; }
            .cta-button { font-size: 14px !important; padding: 12px 20px !important; }
            .footer-logo-text { font-size: 15px !important; }
            .social-icons { font-size: 11px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background:#ffffff; direction:rtl; font-family:Tahoma, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-collapse:collapse;">
        <tr>
            <td class="outer-padding" align="center" style="padding:0 12px 34px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-collapse:collapse;">
                    <tr>
                        <td class="brand-cell" align="right" dir="rtl" style="padding:0 28px 22px; color:#171b24; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                            <img src="https://api.badihy.com/image.png" width="28" height="18" alt="بديهي" style="display:inline-block; width:28px; height:18px; object-fit:contain; vertical-align:middle; margin-left:6px;">
                            <span style="vertical-align:middle;">بديهي</span>
                        </td>
                    </tr>

                    <tr>
                        <td class="hero-wrap" align="center" style="padding:0 28px 34px;">
                            <table class="hero-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:520px; background:#f5f5f5; border-radius:14px; border-collapse:separate;">
                                <tr>
                                    <td class="hero-cell" align="center" valign="middle" style="padding:70px 0;">
                                        <img class="hero-logo" src="https://api.badihy.com/image.png" width="150" alt="بديهي" style="display:inline-block; width:150px; max-width:150px; height:auto; vertical-align:middle;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-cell" align="right" dir="rtl" style="padding:0 58px; color:#171b24; font-family:Tahoma, Arial, sans-serif;">
                            <h1 class="title" style="margin:0 0 24px; color:#171b24; font-size:28px; font-weight:800; line-height:1.4; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                مرحباً ${name}،
                            </h1>

                            <p class="body-copy" style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك على بديهي.
                            </p>

                            <p class="body-copy" style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                لتعيين كلمة مرور جديدة، يرجى الضغط على الزر أدناه واتباع الخطوات المطلوبة.
                            </p>

                            <p class="body-copy" style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                سيتم توجيهك إلى صفحة آمنة لإنشاء كلمة مرور جديدة.
                            </p>

                            <p class="body-copy" style="margin:0 0 32px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                الرابط صالح لمدة ٥ دقائق فقط حفاظاً على أمان حسابك.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="button-cell" align="right" style="padding:0 58px 34px;">
                            <a class="cta-button" href="${link}" style="display:inline-block; background:#5e35b1; color:#ffffff; text-decoration:none; border-radius:5px; padding:13px 32px; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                                إعادة تعيين كلمة المرور
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer-wrap" style="padding:0 58px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eeeeee; border-collapse:collapse;">
                                <tr>
                                    <td align="center" dir="rtl" style="padding-top:24px; color:#171b24; font-family:Tahoma, Arial, sans-serif;">
                                        <p class="footer-copy" style="margin:0 0 18px; color:#5f636d; font-size:13px; line-height:2; text-align:center; font-family:Tahoma, Arial, sans-serif;">
                                            إذا وصلك هذا البريد الإلكتروني عن طريق الخطأ أو كانت لديك أي استفسارات تتعلق بحسابك، لا تتردد في التواصل معنا.
                                        </p>

                                        <p class="footer-copy" style="margin:0 0 18px; color:#5f636d; font-size:13px; line-height:2; text-align:center; font-family:Tahoma, Arial, sans-serif;">
                                            مع تمنياتنا لك بتجربة تعليمية موفقة.
                                        </p>

                                        <p style="margin:0 0 28px; color:#171b24; font-size:13px; font-weight:700; line-height:1.8; text-align:center; font-family:Tahoma, Arial, sans-serif;">
                                            فريق بديهي
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:0 0 24px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td class="footer-logo-text" align="right" dir="rtl" style="color:#171b24; font-size:18px; font-weight:700; line-height:22px; font-family:Tahoma, Arial, sans-serif;">
                                                    <img src="https://api.badihy.com/image.png" width="32" height="21" alt="بديهي" style="display:inline-block; width:32px; height:21px; object-fit:contain; vertical-align:middle; margin-left:7px;">
                                                    <span style="vertical-align:middle;">بديهي</span>
                                                </td>
                                                <td class="social-icons" align="left" dir="ltr" style="color:#a5a8ae; font-size:13px; line-height:22px; font-family:Arial, sans-serif;">
                                                    ○&nbsp;&nbsp;○&nbsp;&nbsp;○&nbsp;&nbsp;○
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
