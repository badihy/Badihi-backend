export const getResetPasswordEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور - بديهي</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; direction:rtl; font-family:Tahoma, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:0 12px 34px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:#ffffff; border-collapse:collapse;">
                    <tr>
                        <td align="right" dir="rtl" style="padding:0 28px 22px; color:#171b24; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                            <img src="https://api.badihy.com/image.png" width="28" height="18" alt="بديهي" style="display:inline-block; width:28px; height:18px; object-fit:contain; vertical-align:middle; margin-left:6px;">
                            <span style="vertical-align:middle;">بديهي</span>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:0 28px 34px;">
                            <table role="presentation" width="520" height="260" cellpadding="0" cellspacing="0" border="0" style="width:520px; height:260px; max-width:100%; background:#f5f5f5; border-radius:14px; border-collapse:separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height:260px; line-height:260px;">
                                        <img src="https://api.badihy.com/image.png" width="150" alt="بديهي" style="display:inline-block; width:150px; max-width:150px; height:auto; vertical-align:middle;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="right" dir="rtl" style="padding:0 58px; color:#171b24; font-family:Tahoma, Arial, sans-serif;">
                            <h1 style="margin:0 0 24px; color:#171b24; font-size:28px; font-weight:800; line-height:1.4; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                مرحباً ${name}،
                            </h1>

                            <p style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك على بديهي.
                            </p>

                            <p style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                لتعيين كلمة مرور جديدة، يرجى الضغط على الزر أدناه واتباع الخطوات المطلوبة.
                            </p>

                            <p style="margin:0 0 18px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                سيتم توجيهك إلى صفحة آمنة لإنشاء كلمة مرور جديدة.
                            </p>

                            <p style="margin:0 0 32px; color:#5f636d; font-size:15px; line-height:2.05; text-align:right; font-family:Tahoma, Arial, sans-serif;">
                                الرابط صالح لمدة ٥ دقائق فقط حفاظاً على أمان حسابك.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="right" style="padding:0 58px 34px;">
                            <a href="${link}" style="display:inline-block; background:#5e35b1; color:#ffffff; text-decoration:none; border-radius:5px; padding:13px 32px; font-size:16px; font-weight:700; line-height:20px; font-family:Tahoma, Arial, sans-serif;">
                                إعادة تعيين كلمة المرور
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 58px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eeeeee; border-collapse:collapse;">
                                <tr>
                                    <td align="center" dir="rtl" style="padding-top:24px; color:#171b24; font-family:Tahoma, Arial, sans-serif;">
                                        <p style="margin:0 0 18px; color:#5f636d; font-size:13px; line-height:2; text-align:center; font-family:Tahoma, Arial, sans-serif;">
                                            إذا وصلك هذا البريد الإلكتروني عن طريق الخطأ أو كانت لديك أي استفسارات تتعلق بحسابك، لا تتردد في التواصل معنا.
                                        </p>

                                        <p style="margin:0 0 18px; color:#5f636d; font-size:13px; line-height:2; text-align:center; font-family:Tahoma, Arial, sans-serif;">
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
                                                <td align="right" dir="rtl" style="color:#171b24; font-size:18px; font-weight:700; line-height:22px; font-family:Tahoma, Arial, sans-serif;">
                                                    <img src="https://api.badihy.com/image.png" width="32" height="21" alt="بديهي" style="display:inline-block; width:32px; height:21px; object-fit:contain; vertical-align:middle; margin-left:7px;">
                                                    <span style="vertical-align:middle;">بديهي</span>
                                                </td>
                                                <td align="left" dir="ltr" style="color:#a5a8ae; font-size:13px; line-height:22px; font-family:Arial, sans-serif;">
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
