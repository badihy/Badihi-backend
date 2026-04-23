const sharedStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
    color: #333;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 100%;
    text-align: center;
  }
  p {
    font-size: 18px;
    line-height: 1.6;
  }
`;

const APP_PACKAGE_NAME = 'com.badihi.app';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE_NAME}`;
const WEB_BASE_URL = 'https://api.badihy.com';

function buildQueryString(
  params: Record<string, string | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

function buildCustomScheme(
  path: string,
  params: Record<string, string | boolean | undefined>,
): string {
  const query = buildQueryString(params);
  return query ? `badihi://${path}?${query}` : `badihi://${path}`;
}

function buildHttpsUrl(
  path: string,
  params: Record<string, string | boolean | undefined>,
): string {
  const cleanPath = path.replace(/^\/+/, '');
  const query = buildQueryString(params);
  return query
    ? `${WEB_BASE_URL}/${cleanPath}?${query}`
    : `${WEB_BASE_URL}/${cleanPath}`;
}

function buildIntentUrl(
  path: string,
  params: Record<string, string | boolean | undefined>,
  browserFallbackUrl: string,
): string {
  const query = buildQueryString(params);
  const normalizedPath = path.replace(/^\/+/, '');
  const querySuffix = query ? `?${query}` : '';

  return `intent://${normalizedPath}${querySuffix}#Intent;scheme=badihi;package=${APP_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(browserFallbackUrl)};end`;
}

export function getVerifyEmailSuccessPage(): string {
  const appParams = {
    success: true,
    verified: true,
  };
  const customScheme = JSON.stringify(
    buildCustomScheme('login', appParams),
  );
  const intentUrl = JSON.stringify(
    buildIntentUrl('login', appParams, PLAY_STORE_URL),
  );

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تم تأكيد الحساب</title>
      <style>
        ${sharedStyles}
        body { color: white; }
        h1 { color: #5e35b1; margin-bottom: 20px; }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #5e35b1;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .open-app-btn {
          background-color: #5e35b1;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .open-app-btn:hover {
          background-color: #4527a0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>تم تأكيد حسابك بنجاح</h1>
        <p>يمكنك الآن الرجوع إلى التطبيق وتسجيل الدخول بالبيانات التي أنشأتها.</p>
        <div class="spinner"></div>
        <button class="open-app-btn" onclick="openApp()">الرجوع إلى التطبيق</button>
      </div>
      <script>
        let appOpened = false;

        window.addEventListener('blur', function() {
          appOpened = true;
        });

        function openApp() {
          const customScheme = ${customScheme};
          const intentUrl = ${intentUrl};
          const isAndroid = /Android/i.test(navigator.userAgent);

          if (isAndroid) {
            window.location.href = intentUrl;

            setTimeout(function() {
              if (!appOpened && document.hasFocus()) {
                window.location.href = customScheme;
              }
            }, 500);
          } else {
            window.location.href = customScheme;
          }
        }

        window.onload = function() {
          setTimeout(openApp, 300);
        };
      </script>
    </body>
    </html>
  `;
}

export function getVerifyEmailErrorPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فشل التحقق</title>
      <style>
        ${sharedStyles}
        body { color: white; }
        h1 { color: #d32f2f; margin-bottom: 20px; }
        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>فشل تأكيد الحساب</h1>
        <p>رابط التفعيل غير صالح أو انتهت صلاحيته. من فضلك اطلب رابط تفعيل جديد.</p>
      </div>
    </body>
    </html>
  `;
}

export function getInvalidResetPasswordLinkPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error</title>
      <style>
        ${sharedStyles}
        body { color: white; }
        h1 { color: #d32f2f; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Invalid link</h1>
        <p>Please use the link provided in the email.</p>
      </div>
    </body>
    </html>
  `;
}

function getPasswordPage(
  token: string,
  options: {
    title: string;
    heading: string;
    buttonLabel: string;
    infoText: string;
    appPath: 'reset-password';
    browserPath: 'reset-password';
  },
): string {
  const tokenJson = JSON.stringify(token);
  const playStoreUrl = JSON.stringify(PLAY_STORE_URL);
  const browserFallbackUrl = JSON.stringify(
    buildHttpsUrl(options.browserPath, {
      token,
      openAppAttempted: true,
    }),
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
      <style>
        ${sharedStyles}
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        button:hover {
          background-color: #4527a0;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #5e35b1;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
        <h1>${options.heading}</h1>
        <div id="message" class="message"></div>
        <form id="resetForm" onsubmit="handleSubmit(event)">
          <input type="hidden" id="token" value="${token}">
          <input type="password" id="newPassword" placeholder="New password" required>
          <input type="password" id="confirmPassword" placeholder="Confirm password" required>
          <button type="submit">${options.buttonLabel}</button>
        </form>
        <p class="info">${options.infoText}</p>
      </div>
      <script>
        let appOpened = false;
        const resetToken = ${tokenJson};
        const playStoreUrl = ${playStoreUrl};
        const browserFallbackUrl = ${browserFallbackUrl};

        window.addEventListener('blur', function() {
          appOpened = true;
        });

        function buildQuery(params) {
          const searchParams = new URLSearchParams();

          Object.entries(params).forEach(function(entry) {
            const key = entry[0];
            const value = entry[1];

            if (value === undefined || value === null || value === '') {
              return;
            }

            searchParams.set(key, String(value));
          });

          return searchParams.toString();
        }

        function buildCustomScheme(path, params) {
          const query = buildQuery(params);
          return query ? 'badihi://' + path + '?' + query : 'badihi://' + path;
        }

        function buildIntentUrl(path, params, fallbackUrl) {
          const query = buildQuery(params);
          const querySuffix = query ? '?' + query : '';

          return 'intent://' + path + querySuffix + '#Intent;scheme=badihi;package=${APP_PACKAGE_NAME};S.browser_fallback_url=' + encodeURIComponent(fallbackUrl) + ';end';
        }

        function openApp(params, fallbackUrl) {
          const customScheme = buildCustomScheme('${options.appPath}', params);
          const intentUrl = buildIntentUrl('${options.appPath}', params, fallbackUrl);
          const isAndroid = /Android/i.test(navigator.userAgent);

          if (isAndroid) {
            window.location.href = intentUrl;
          } else {
            window.location.href = customScheme;
          }
        }

        window.onload = function() {
          const params = new URLSearchParams(window.location.search);
          const alreadyAttempted = params.get('openAppAttempted') === '1';

          if (!alreadyAttempted) {
            setTimeout(function() {
              openApp({ token: resetToken }, browserFallbackUrl);
            }, 300);
          }
        };

        function returnToAppAfterSuccess(data) {
          const params = {
            success: true,
            passwordUpdated: true,
            token: data && data.accessToken,
            refreshToken: data && data.refreshToken,
          };

          openApp(params, playStoreUrl);
        }

        async function handleSubmit(event) {
          event.preventDefault();
          const token = resetToken || document.getElementById('token').value;
          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const messageDiv = document.getElementById('message');

          if (newPassword !== confirmPassword) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Passwords do not match';
            return;
          }

          try {
            const response = await fetch('/api/auth/reset-password', {
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
              messageDiv.textContent = 'Password reset successfully! Returning to the app...';
              document.getElementById('resetForm').reset();
              setTimeout(function() {
                returnToAppAfterSuccess(data);
              }, 300);
            } else {
              messageDiv.className = 'message error';
              messageDiv.textContent = data.message || 'Something went wrong';
            }
          } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'A network error occurred';
          }
        }
      </script>
    </body>
    </html>
  `;
}

export function getResetPasswordPage(token: string): string {
  return getPasswordPage(token, {
    title: 'Reset Password',
    heading: 'Reset Password',
    buttonLabel: 'Reset password',
    infoText: 'If you are using the mobile app, it may open automatically.',
    appPath: 'reset-password',
    browserPath: 'reset-password',
  });
}
