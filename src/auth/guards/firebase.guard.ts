import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type * as admin from 'firebase-admin';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const googleClient = new OAuth2Client();

/** بصمة قصيرة للـ JWT في اللوق (بدون كشف الرمز كاملًا). */
function tokenFingerprint(token: string): string {
  if (!token || token.length < 12) {
    return `(طول=${token?.length ?? 0})`;
  }
  return `len=${token.length} …${token.slice(-12)}`;
}

function getAllowedGoogleClientIds(): string[] {
  const fromList = (process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_MOBILE,
  ]
    .filter(Boolean)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);

  return [...new Set([...ids, ...fromList])];
}

function extractIdTokenWithSource(request: {
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}): { token: string | null; source: string } {
  const rawAuth =
    request.headers?.authorization ?? request.headers?.Authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (authHeader) {
    const parts = String(authHeader).trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer' && parts[1]) {
      return { token: parts[1].trim(), source: 'Authorization: Bearer' };
    }
  }

  const body = request.body;
  if (body && typeof body === 'object') {
    if (
      typeof (body as { idToken?: string }).idToken === 'string' &&
      (body as { idToken?: string }).idToken!.length > 0
    ) {
      return {
        token: (body as { idToken: string }).idToken.trim(),
        source: 'body.idToken',
      };
    }
    if (
      typeof (body as { id_token?: string }).id_token === 'string' &&
      (body as { id_token?: string }).id_token!.length > 0
    ) {
      return {
        token: (body as { id_token: string }).id_token.trim(),
        source: 'body.id_token',
      };
    }
  }

  return { token: null, source: 'none' };
}

@Injectable()
export class FirebaseGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseGuard.name);

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method ?? '?';
    const path = request.url ?? request.path ?? '?';

    const { token, source } = extractIdTokenWithSource(request);

    this.logger.log(
      `[FirebaseGuard] طلب ${method} ${path} | مصدر الرمز: ${source} | ${tokenFingerprint(token ?? '')}`,
    );

    if (!token) {
      this.logger.warn(
        `[FirebaseGuard] فشل: لا يوجد رمز — ${method} ${path} (توقع Bearer أو body.idToken)`,
      );
      throw new UnauthorizedException(
        'No token provided — use Authorization: Bearer <idToken> or JSON { "idToken": "..." }',
      );
    }

    this.logger.log(
      `[FirebaseGuard] محاولة ① Firebase admin.auth().verifyIdToken | ${tokenFingerprint(token)}`,
    );

    try {
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(token);

      this.logger.log(
        `[FirebaseGuard] نجح Firebase verify | uid=${decodedToken.uid} email=${decodedToken.email ?? '—'} provider=${decodedToken.firebase?.sign_in_provider ?? '—'}`,
      );

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture:
          (decodedToken as { picture?: string }).picture ||
          (decodedToken as { photoURL?: string }).photoURL,
        provider: decodedToken.firebase.sign_in_provider,
      };

      return true;
    } catch (firebaseErr) {
      const msg =
        firebaseErr instanceof Error ? firebaseErr.message : String(firebaseErr);
      this.logger.warn(
        `[FirebaseGuard] فشل ① Firebase verify → الانتقال لـ Google | السبب: ${msg}`,
      );

      this.logger.log(
        `[FirebaseGuard] محاولة ② Google OAuth2 verifyIdToken | ${tokenFingerprint(token)}`,
      );

      try {
        const payload = await verifyGoogleIdToken(token, this.logger);
        this.logger.log(
          `[FirebaseGuard] نجح Google verify | sub=${payload.sub} email=${payload.email ?? '—'}`,
        );

        request.user = {
          uid: payload.sub!,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: 'google',
        };
        return true;
      } catch (googleErr) {
        const gMsg =
          googleErr instanceof Error ? googleErr.message : String(googleErr);
        this.logger.error(
          `[FirebaseGuard] فشل ② Google verify أيضًا | Firebase كان: ${msg} | Google: ${gMsg} | ${method} ${path} | ${tokenFingerprint(token)}`,
        );
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
}

/**
 * تحقق بـ audience كمصفوفة ثم لكل معرف عميل على حدة.
 */
async function verifyGoogleIdToken(
  token: string,
  logger: Logger,
): Promise<TokenPayload> {
  const audience = getAllowedGoogleClientIds();

  logger.log(
    `[FirebaseGuard:Google] معرفات العملاء المسموحة (${audience.length}): ${audience.map(maskClientId).join(', ') || '(فارغ)'}`,
  );

  if (audience.length === 0) {
    logger.error(
      '[FirebaseGuard:Google] لا يوجد GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID_MOBILE / GOOGLE_CLIENT_IDS',
    );
    throw new Error(
      'No Google client IDs configured for ID token verification',
    );
  }

  logger.log('[FirebaseGuard:Google] محاولة verifyIdToken(audience: مصفوفة كاملة)');
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    if (payload) {
      logger.log('[FirebaseGuard:Google] نجحت المحاولة بـ audience (مصفوفة)');
      return payload;
    }
    logger.warn('[FirebaseGuard:Google] ticket بدون payload بعد verify (مصفوفة)');
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    logger.warn(`[FirebaseGuard:Google] فشل verify بـ audience مصفوفة: ${m}`);
  }

  let lastErr: Error | undefined;
  for (let i = 0; i < audience.length; i++) {
    const aud = audience[i];
    logger.log(
      `[FirebaseGuard:Google] محاولة ${i + 1}/${audience.length} verifyIdToken(audience=${maskClientId(aud)})`,
    );
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: aud,
      });
      const payload = ticket.getPayload();
      if (payload) {
        logger.log(
          `[FirebaseGuard:Google] نجحت مع audience=${maskClientId(aud)}`,
        );
        return payload;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      logger.warn(
        `[FirebaseGuard:Google] فشل مع audience=${maskClientId(aud)}: ${lastErr.message}`,
      );
    }
  }

  logger.error(
    `[FirebaseGuard:Google] انتهت كل المحاولات — آخر خطأ: ${lastErr?.message ?? 'unknown'}`,
  );
  throw lastErr ?? new Error('Failed to verify Google ID token');
}

/** إظهار جزء من معرف العميل فقط في اللوق. */
function maskClientId(id: string): string {
  if (!id || id.length < 20) {
    return id || '(empty)';
  }
  return `${id.slice(0, 12)}…${id.slice(-8)}`;
}
