export const getWelcomeEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مرحباً بك في بديهي</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; direction:rtl; font-family:Tahoma, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:32px 12px 28px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; border-collapse:collapse;">
                    <tr>
                        <td align="right" dir="rtl" style="padding:0 40px 22px 40px; color:#171b24; font-size:16px; font-weight:700; line-height:20px;">
                            <img src="https://api.badihy.com/image.png" width="26" height="18" alt="بديهي" style="display:inline-block; width:26px; height:18px; object-fit:contain; vertical-align:middle; margin-left:6px;">
                            <span style="vertical-align:middle;">بديهي</span>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:0 40px 34px;">
                            <table role="presentation" width="520" height="260" cellpadding="0" cellspacing="0" border="0" style="width:520px; height:260px; max-width:100%; background:#f5f5f5; border-radius:16px; border-collapse:separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height:260px; line-height:260px;">
                                        <img src="https://api.badihy.com/image.png" width="150" alt="بديهي" style="display:inline-block; width:150px; max-width:150px; height:auto; vertical-align:middle;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="right" dir="rtl" style="padding:0 40px;">
                            <h1 style="margin:0 0 22px; color:#171b24; font-size:28px; font-weight:800; line-height:1.5; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                مرحباً ${name}،
                            </h1>

                            <p style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                يسعدنا انضمامك إلى بديهي.
                            </p>

                            <p style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                تم إنشاء حسابك بنجاح وأصبح بإمكانك الآن الوصول إلى محتوى تعليمي يساعدك على الفهم والتطبيق، خطوة بخطوة.
                            </p>

                            <p style="margin:0 0 22px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                في بديهي نحرص على تقديم محتوى مختصر ومنظم يركّز على الفكرة الأساسية دون تعقيد حتى تتعلم بكفاءة وتستفيد مما تتعلمه فعلياً.
                            </p>

                            <p style="margin:0 0 30px; color:#5f636d; font-size:16px; line-height:2; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                إذا احتجت أي مساعدة أو واجهت أي مشكلة أثناء استخدام التطبيق، فريق بديهي موجود لدعمك في أي وقت.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="right" style="padding:0 40px 38px;">
                            <a href="${link}" style="display:inline-block; background:#5e35b1; color:#ffffff; text-decoration:none; border-radius:6px; padding:12px 24px; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                                تسجيل الدخول
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 40px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eeeeee; border-collapse:collapse;">
                                <tr>
                                    <td align="right" dir="rtl" style="padding-top:22px;">
                                        <p style="margin:0 0 14px; color:#5f636d; font-size:12px; line-height:1.9; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                            إذا وصلك هذا البريد الإلكتروني عن طريق الخطأ أو كانت لديك أي استفسارات تتعلق بحسابك، لا تتردد في التواصل معنا.
                                        </p>
                                        <p style="margin:0 0 14px; color:#5f636d; font-size:12px; line-height:1.9; text-align:right; font-family:Tahoma, Arial, sans-serif;">
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
                                                <td align="right" dir="rtl" style="color:#171b24; font-size:16px; font-weight:700; line-height:22px; font-family:Tahoma, Arial, sans-serif;">
                                                    <img src="https://api.badihy.com/image.png" width="30" height="20" alt="بديهي" style="display:inline-block; width:30px; height:20px; object-fit:contain; vertical-align:middle; margin-left:7px;">
                                                    <span style="vertical-align:middle;">بديهي</span>
                                                </td>
                                                <td align="left" dir="ltr" style="color:#a5a8ae; font-size:14px; line-height:22px; font-family:Arial, sans-serif;">
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
