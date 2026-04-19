type GoogleAuthTestPageOptions = {
  clientId: string;
};

export function getGoogleAuthTestPage({
  clientId,
}: GoogleAuthTestPageOptions): string {
  const safeClientId = JSON.stringify(clientId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Badihi Google Auth Test</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5efe5;
      --panel: #fffdf8;
      --ink: #1f2937;
      --muted: #6b7280;
      --line: #e7dcc8;
      --accent: #8a3b12;
      --accent-soft: #f4dfd2;
      --success: #116149;
      --error: #9f1239;
      --warning: #8a4b08;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top right, rgba(138, 59, 18, 0.12), transparent 28%),
        linear-gradient(180deg, #fbf7f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }

    main {
      width: min(960px, calc(100% - 32px));
      margin: 32px auto;
      display: grid;
      gap: 16px;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 18px 40px rgba(31, 41, 55, 0.06);
    }

    h1, h2, h3, p {
      margin: 0;
    }

    .hero {
      display: grid;
      gap: 12px;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero h1 {
      font-size: clamp(28px, 5vw, 42px);
      line-height: 1.08;
    }

    .hero p {
      color: var(--muted);
      line-height: 1.7;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .stack {
      display: grid;
      gap: 12px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      width: fit-content;
    }

    .button {
      appearance: none;
      border: 0;
      border-radius: 12px;
      background: var(--accent);
      color: white;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, opacity 120ms ease;
    }

    .button:hover {
      transform: translateY(-1px);
      opacity: 0.95;
    }

    .button.secondary {
      background: #374151;
    }

    .button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      transform: none;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .note {
      border-left: 4px solid var(--warning);
      background: #fff8eb;
      color: #7c5100;
      padding: 12px 14px;
      border-radius: 12px;
      line-height: 1.6;
    }

    .banner {
      display: none;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid transparent;
      line-height: 1.6;
      font-size: 14px;
      font-weight: 600;
    }

    .banner.visible {
      display: block;
    }

    .banner.success {
      background: #ecfdf3;
      border-color: #a7f3d0;
      color: #166534;
    }

    .banner.error {
      background: #fff1f2;
      border-color: #fecdd3;
      color: #9f1239;
    }

    .result {
      background: #151a22;
      color: #d6e2ff;
      border-radius: 16px;
      padding: 16px;
      min-height: 220px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.65;
    }

    .meta {
      display: grid;
      gap: 8px;
      color: var(--muted);
      font-size: 14px;
    }

    .meta strong {
      color: var(--ink);
    }

    .status-success {
      color: var(--success);
    }

    .status-error {
      color: var(--error);
    }

    .mono {
      font-family: Consolas, "Courier New", monospace;
      font-size: 13px;
    }

    @media (max-width: 640px) {
      body {
        background:
          radial-gradient(circle at top right, rgba(138, 59, 18, 0.08), transparent 24%),
          linear-gradient(180deg, #fbf7f0 0%, var(--bg) 100%);
      }

      main {
        width: min(100% - 20px, 960px);
        margin: 16px auto 24px;
      }

      .card {
        padding: 16px;
        border-radius: 16px;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="card hero">
      <span class="eyebrow">Backend Debug Page</span>
      <h1>Google Auth End-to-End Test</h1>
      <p>
        الصفحة دي بتجرب Google login من المتصفح مباشرة على نفس الباك إند، علشان نعرف بسرعة
        هل المشكلة من Flutter integration ولا من الـ backend.
      </p>
      <div class="pill">Origin: <span id="originLabel"></span></div>
    </section>

    <section class="card stack">
      <h2>Before You Start</h2>
      <div class="note">
        لازم تضيف الـ origin الحالي في Google Console داخل <strong>Authorized JavaScript origins</strong>.
        مثال محلي: <span class="mono">http://localhost:3001</span>
      </div>
      <div class="meta">
        <div><strong>Client ID:</strong> <span id="clientIdLabel" class="mono"></span></div>
        <div><strong>ID token endpoint:</strong> <span class="mono">POST /api/auth/mobile</span></div>
        <div><strong>Auth code endpoint:</strong> <span class="mono">POST /api/auth/mobile/auth-code</span></div>
      </div>
    </section>

    <section class="grid">
      <section class="card stack">
        <h2>Legacy ID Token Flow</h2>
        <p>ده نفس الفلو القديم: Google Sign-In Button يرجّع <span class="mono">idToken</span> ونبعته للباك.</p>
        <div id="googleButton"></div>
        <button id="clearButton" class="button secondary" type="button">Clear Output</button>
      </section>

      <section class="card stack">
        <h2>Server Auth Code Flow</h2>
        <p>الفلو المعتمد: زر واحد يفتح Google، يستلم <span class="mono">authorization code</span>، ثم يرسله تلقائيًا للباك.</p>
        <div class="actions">
          <button id="authCodeButton" class="button" type="button">Run Full Auth Code Flow</button>
        </div>
      </section>
    </section>

    <section class="card stack">
      <h2>Live Output</h2>
      <div id="statusBanner" class="banner"></div>
      <div id="result" class="result">Waiting for Google action...</div>
    </section>
  </main>

  <script>
    const GOOGLE_CLIENT_ID = ${safeClientId};
    const resultEl = document.getElementById('result');
    const authCodeButton = document.getElementById('authCodeButton');
    const statusBanner = document.getElementById('statusBanner');

    document.getElementById('originLabel').textContent = window.location.origin;
    document.getElementById('clientIdLabel').textContent = GOOGLE_CLIENT_ID || '(missing)';

    function setOutput(label, payload, isError) {
      const prefix = '[' + new Date().toLocaleTimeString() + '] ' + label;
      const body =
        typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      resultEl.textContent = prefix + '\\n\\n' + body;
      resultEl.classList.toggle('status-error', Boolean(isError));
      resultEl.classList.toggle('status-success', !isError);
    }

    function setBanner(message, type) {
      statusBanner.textContent = message;
      statusBanner.className = 'banner visible ' + (type || 'success');
    }

    function clearBanner() {
      statusBanner.textContent = '';
      statusBanner.className = 'banner';
    }

    async function postJson(url, data) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let payload;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }

      if (!response.ok) {
        throw {
          status: response.status,
          payload,
        };
      }

      return payload;
    }

    function decodeJwtPayload(token) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const normalized = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      return JSON.parse(atob(normalized));
    }

    function handleIdTokenResponse(response) {
      const credential = response.credential;
      const payload = decodeJwtPayload(credential);

      setOutput('Google ID token received', {
        payload,
        credentialPreview: credential.slice(0, 48) + '...',
      });

      postJson('/api/auth/mobile', { idToken: credential })
        .then((data) => setOutput('Legacy ID token flow succeeded', data, false))
        .catch((error) => setOutput('Legacy ID token flow failed', error, true));
    }

    function initGoogleFlows() {
      if (!window.google || !window.google.accounts) {
        setOutput('Google SDK error', 'Google Identity Services SDK did not load', true);
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleIdTokenResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById('googleButton'),
        {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          width: 280,
        },
      );

      const codeClient = google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: (response) => {
          setOutput('Google auth code received', {
            serverAuthCode: response.code || null,
            scope: response.scope,
          });

          postJson('/api/auth/mobile/auth-code', {
            serverAuthCode: response.code,
          })
            .then((data) => {
              const user = data?.data?.user;
              const userLabel = user?.email || user?.username || user?.id || 'the user';

              setBanner(
                'Google auth code flow succeeded. User authenticated successfully: ' + userLabel,
                'success',
              );
              setOutput('Auth code flow succeeded', data, false);
            })
            .catch((error) => {
              setBanner('Google auth code flow failed. The user was not authenticated.', 'error');
              setOutput('Auth code flow failed', error, true);
            });
        },
        error_callback: (error) => {
          setBanner('Google popup failed before the backend could authenticate the user.', 'error');
          setOutput('Google auth code popup error', error, true);
        },
      });

      authCodeButton.addEventListener('click', () => {
        clearBanner();
        setOutput('Auth code flow', 'Opening Google popup...');
        codeClient.requestCode();
      });

      document.getElementById('clearButton').addEventListener('click', () => {
        clearBanner();
        resultEl.classList.remove('status-error', 'status-success');
        resultEl.textContent = 'Waiting for Google action...';
      });
    }

    window.addEventListener('load', () => {
      if (!GOOGLE_CLIENT_ID) {
        setOutput('Configuration error', 'GOOGLE_CLIENT_ID is missing on the server', true);
        return;
      }

      let retries = 0;
      const timer = window.setInterval(() => {
        if (window.google && window.google.accounts) {
          window.clearInterval(timer);
          initGoogleFlows();
          return;
        }

        retries += 1;
        if (retries >= 40) {
          window.clearInterval(timer);
          setOutput('Google SDK error', 'Timed out while waiting for Google SDK', true);
        }
      }, 250);
    });
  </script>
</body>
</html>`;
}
