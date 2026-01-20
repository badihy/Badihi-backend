export const getWelcomeEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Badihi</title>
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
            text-align: left; /* Logo seems to be on top left in typical LTR, but image shows Top Right with Arabic text? No, image has logo on top RIGHT (Badihi text + Icon). */
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

        .logo-icon {
            width: 24px;
            height: 24px;
            background-color: #5e35b1; /* Purple accent */
            border-radius: 4px; /* Simulating the logo shape */
            transform: skew(-10deg);
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

        /* Abstract purple shape in center */
        .hero-icon {
            font-size: 80px; 
            color: #6a4c93; 
        }
        
        /* Simulating the image placeholder content */
        .shape-group {
            position: relative;
            width: 100px;
            height: 100px;
        }
        .shape-1 {
            position: absolute;
            background-color: #9575cd; /* Lighter purple */
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
            background-color: #5e35b1; /* Darker purple */
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
            text-align: left; /* Button logic: usually centered or consistent flow. Image shows left aligned (RTL left is start?). No, image shows button somewhat left-aligned relative to text? Wait. Image text is RTL. Button is usually placed naturally. I will clear align left as per RTL flow (which is Right on screen? No RTL Left is End). Let's see image. 
            Image: Button is on the LEFT side of the RTL text (so end of line? or start?). 
            Wait, "مرحباً ضياء" is on the Right. Text is Right aligned. Button "تسجيل الدخول" is aligned to the Left?
            Actually looking at the image provided in prompt context, the button seems aligned to the LEFT of the container (which might be the 'start' if it was LTR, but in RTL 'left' is 'end'). 
            Let's stick to 'right' alignment (default for RTL) or 'start'. 
            Actually, commonly email buttons are block or extensive. 
            Let's look closely at image. The button is purple, text is white. It looks aligned to the LEFT side of the card. In RTL getting to left means 'end'.
            I will confirm text-align: right for body. Button container: text-align: left?
            */
            text-align: right; /* Default RTL flow */
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
            text-align: left; /* Social icons on left? Image shows them on left. */
            display: flex; 
            gap: 10px;
            justify-content: flex-end; /* Or left? Image bottom left corner has Badihi logo again? No, Badihi logo bottom right. Social icons??? I see symbols on bottom left. I'll put them on left. */
            flex-direction: row-reverse; /* To keep RTL but move to left? */
        }
        
        .social-icons img {
            width: 20px;
            height: 20px;
            filter: opacity(0.5);
        }

        /* RTL support */
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
            
            <p>يسعدنا انضمامك إلى بديهي.</p>
            
            <p>تم إنشاء حسابك بنجاح، وأصبح بإمكانك الآن الوصول إلى محتوى تعليمي يساعدك على الفهم والتطبيق، خطوة بخطوة.</p>
            
            <p>في بديهي نحرص على تقديم محتوى مختصر ومنظم، يركّز على الفكرة الأساسية دون تعقيد، حتى تتعلّم بكفاءة وتستفيد مما تتعلّمه فعليًا.</p>
            
            <p>إذا احتجت أي مساعدة أو واجهت أي مشكلة أثناء استخدام التطبيق، فريق بديهي موجود لدعمك في أي وقت.</p>

            <div class="btn-container" style="text-align: left;"> <!-- Manually force left as per image observation (bottom left button) -->
                <a href="${link}" class="btn">تسجيل الدخول</a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>إذا وصلك هذا البريد الإلكتروني عن طريق الخطأ، أو كانت لديك أي استفسارات تتعلق بحسابك، لا تتردد في التواصل معنا.</p>
            <p>مع تمنياتنا لك بتجربة تعليمية موفقة.</p>
            
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
                <!-- Social Icons Placeholder -->
                <div class="social-icons">
                    <!-- Icons would go here -->
                </div>
           </div>
        </div>
    </div>
</body>
</html>
`;
