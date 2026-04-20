export const getWelcomeEmailHtml = (name: string, link: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Badihi</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            justify-content: flex-start;
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
            text-align: left;
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
            text-align: left;
        }

        .footer-logo {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        .social-icons {
            margin-top: 10px;
            text-align: left;
            display: flex;
            gap: 10px;
            justify-content: flex-start;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="width: 30px; height: 30px; margin-right: 5px;">
                <img src="https://api.badihy.com/image.png" alt="Badihi Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="logo-text">Badihi</div>
        </div>

        <div class="hero-image">
            <div class="shape-group">
                <div class="shape-1"></div>
                <div class="shape-2"></div>
            </div>
        </div>

        <div class="content">
            <h1>Hello ${name},</h1>
            
            <p>We are excited to welcome you to Badihi.</p>
            
            <p>Your account has been created successfully, and you can now access educational content built to help you understand and apply ideas step by step.</p>
            
            <p>At Badihi, we focus on clear and structured learning experiences that highlight the main idea without unnecessary complexity.</p>
            
            <p>If you need help or run into any issue while using the app, the Badihi team is here to support you.</p>

            <div class="btn-container">
                <a href="${link}" class="btn">Sign in</a>
            </div>
        </div>

        <div class="footer">
            <p>If you received this email by mistake or have any questions about your account, please contact us.</p>
            <p>We wish you a productive and enjoyable learning experience.</p>
            
            <div class="footer-logo">
                <strong>The Badihi Team</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div class="logo-text" style="font-size: 16px; display: flex; align-items: center; margin-left: 0;">
                    <div style="width: 20px; height: 20px; margin-right: 5px;">
                        <img src="https://api.badihy.com/image.png" alt="Badihi Logo" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    Badihi
                </div>
                <div class="social-icons"></div>
           </div>
        </div>
    </div>
</body>
</html>
`;
