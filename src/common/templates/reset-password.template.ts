export const getResetPasswordEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور - بديهي</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Tajawal', sans-serif;
            color: #333333;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: left;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 30px;
        }

        .logo-text {
            font-weight: 700;
            font-size: 20px;
            color: #000;
            margin-left: 10px;
        }

        .hero-image {
            background-color: #f4f4f4;
            width: 100%;
            height: 250px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            position: relative;
        }

        .shape-group {
            position: relative;
            width: 100px;
            height: 100px;
        }
        .shape-1 {
            position: absolute;
            background-color: #9575cd;
            width: 60px;
            height: 60px;
            border-radius: 10px;
            top: 0;
            left: 0;
            transform: rotate(-15deg);
            opacity: 0.8;
        }
        .shape-2 {
            position: absolute;
            background-color: #5e35b1;
            width: 70px;
            height: 70px;
            border-radius: 12px;
            top: 10px;
            left: 20px;
            transform: rotate(15deg);
        }

        .content {
            text-align: right;
        }

        h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #000;
        }

        p {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 20px;
        }

        .btn-container {
            margin-top: 30px;
            text-align: left;
        }
        
        .btn {
            background-color: #5e35b1;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            display: inline-block;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            font-size: 12px;
            color: #888;
            text-align: right;
        }

        .footer-logo {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        .social-icons {
            margin-top: 10px;
            text-align: left;
            display: flex; 
            gap: 10px;
            justify-content: flex-end;
            flex-direction: row-reverse;
        }
        
        .social-icons img {
            width: 20px;
            height: 20px;
            filter: opacity(0.5);
        }

        *[dir="rtl"] {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Logo -->
        <div class="header">
            <div class="logo-text">بديـهـي</div>
            <div style="width: 30px; height: 30px; margin-right: 5px;">
                <img src="https://api.badihy.com/image.png" alt="Badihi Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
        </div>

        <!-- Hero Image Placeholder -->
        <div class="hero-image">
            <div class="shape-group">
                <div class="shape-1"></div>
                <div class="shape-2"></div>
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <h1>مرحباً ${name}،</h1>
            
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في بديهي.</p>
            
            <p>يمكنك تغيير كلمة المرور من خلال الضغط على الزر أدناه. الرابط صالح لمدة ساعة واحدة فقط.</p>
            
            <div class="btn-container" style="text-align: left;">
                <a href="${link}" class="btn">إعادة تعيين كلمة المرور</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
            <p>مع تمنياتنا لك بتجربة آمنة.</p>
            
            <div class="footer-logo">
                <strong>فريق بديهي</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div class="logo-text" style="font-size: 16px; display: flex; align-items: center;">
                    بديـهـي
                    <div style="width: 20px; height: 20px; margin-right: 5px;">
                        <img src="https://api.badihy.com/image.png" alt="Badihi Logo" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                </div>
                <div class="social-icons">
                    <!-- Icons would go here -->
                </div>
           </div>
        </div>
    </div>
</body>
</html>
`;
