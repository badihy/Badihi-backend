export const getWelcomeEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مرحباً بك في بديهي</title>
    <style>
        table { border-spacing: 0; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        @media only screen and (max-width: 600px) {
            .outer-padding { padding: 22px 18px 30px !important; }
            .brand-cell { padding: 0 4px 18px !important; }
            .hero-wrap { padding: 0 4px 30px !important; }
            .hero-cell { padding: 58px 0 !important; }
            .content-cell { padding: 0 8px !important; }
            .button-cell { padding: 0 8px 34px !important; }
            .footer-wrap { padding: 0 8px !important; }
        }
        @media only screen and (max-width: 480px) {
            .outer-padding { padding: 18px 14px 28px !important; }
            .brand-cell { padding: 0 2px 18px !important; }
            .hero-wrap { padding: 0 2px 28px !important; }
            .hero-cell { padding: 48px 0 !important; }
            .hero-logo { width: 118px !important; max-width: 118px !important; }
            .title { font-size: 23px !important; line-height: 1.45 !important; }
            .body-copy { font-size: 14px !important; line-height: 1.9 !important; margin-bottom: 16px !important; }
            .footer-copy { font-size: 12px !important; line-height: 1.8 !important; }
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
            <td class="outer-padding" align="center" style="padding:32px 12px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; border-collapse:collapse;">
                    <tr>
                        <td class="brand-cell" align="right" dir="rtl" style="padding:0 40px 22px 40px; color:#171b24; font-size:16px; font-weight:700; line-height:20px;">
                            <img src="https://api.badihy.com/image.png" width="26" height="18" alt="بديهي" style="display:inline-block; width:26px; height:18px; object-fit:contain; vertical-align:middle; margin-left:6px;">
                            <span style="vertical-align:middle;">بديهي</span>
                        </td>
                    </tr>

                    <tr>
                        <td class="hero-wrap" align="center" style="padding:0 40px 34px;">
                            <table class="hero-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:520px; background:#f5f5f5; border-radius:16px; border-collapse:separate;">
                                <tr>
                                    <td class="hero-cell" align="center" valign="middle" style="padding:70px 0;">
                                        <img class="hero-logo" src="https://api.badihy.com/image.png" width="150" alt="بديهي" style="display:inline-block; width:150px; max-width:150px; height:auto; vertical-align:middle;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-cell" align="right" dir="rtl" style="padding:0 40px;">
                            <h1 class="title" style="margin:0 0 22px; color:#171b24; font-size:28px; font-weight:800; line-height:1.5; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                مرحباً ${name}،
                            </h1>

                            <p class="body-copy" style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                يسعدنا انضمامك إلى بديهي.
                            </p>

                            <p class="body-copy" style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                تم إنشاء حسابك بنجاح، والخطوة الأخيرة الآن هي تأكيد بريدك الإلكتروني حتى تتمكن من تسجيل الدخول إلى التطبيق.
                            </p>

                            <p class="body-copy" style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                في بديهي نحرص على تقديم محتوى مختصر ومنظم يركّز على الفكرة الأساسية دون تعقيد حتى تتعلم بكفاءة وتستفيد مما تتعلمه فعلياً.
                            </p>

                            <p class="body-copy" style="margin:0 0 30px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                بعد الضغط على زر التأكيد سيتم تفعيل حسابك، ثم يمكنك الرجوع للتطبيق وتسجيل الدخول بالبريد الإلكتروني وكلمة المرور اللذين أنشأتهما.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="button-cell" align="right" style="padding:0 40px 38px;">
                            <a class="cta-button" href="${link}" style="display:inline-block; background:#5e35b1; color:#ffffff; text-decoration:none; border-radius:6px; padding:12px 24px; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                                تأكيد الحساب
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer-wrap" style="padding:0 40px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eeeeee; border-collapse:collapse;">
                                <tr>
                                    <td align="right" dir="rtl" style="padding-top:22px;">
                                        <p class="footer-copy" style="margin:0 0 14px; color:#5f636d; font-size:12px; line-height:1.9; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                            إذا وصلك هذا البريد الإلكتروني عن طريق الخطأ أو كانت لديك أي استفسارات تتعلق بحسابك، لا تتردد في التواصل معنا.
                                        </p>
                                        <p class="footer-copy" style="margin:0 0 14px; color:#5f636d; font-size:12px; line-height:1.9; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                            مع تمنياتنا لك بتجربة تعليمية موفقة.
                                        </p>
                                        <p style="margin:0; color:#171b24; font-size:13px; font-weight:700; line-height:1.9; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                            فريق بديهي
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top:28px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td class="footer-logo-text" align="right" dir="rtl" style="color:#171b24; font-size:16px; font-weight:700; line-height:22px; font-family:Tahoma, Arial, sans-serif;">
                                                    <img src="https://api.badihy.com/image.png" width="30" height="20" alt="بديهي" style="display:inline-block; width:30px; height:20px; object-fit:contain; vertical-align:middle; margin-left:7px;">
                                                    <span style="vertical-align:middle;">بديهي</span>
                                                </td>
                                                <td class="social-icons" align="left" dir="ltr" style="color:#a5a8ae; font-size:14px; line-height:22px; font-family:Arial, sans-serif;">
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
