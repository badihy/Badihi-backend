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

/** Authorization: Bearer أو جسم JSON { idToken } — منطق مطابق لتطبيقات الموبايل. */
function extractIdToken(request: {
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}): string | null {
  const rawAuth =
    request.headers?.authorization ?? request.headers?.Authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (authHeader) {
    const parts = String(authHeader).trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer' && parts[1]) {
      return parts[1].trim();
    }
  }

  const body = request.body;
  if (body && typeof body === 'object') {
    const t =
      (body as { idToken?: string }).idToken ??
      (body as { id_token?: string }).id_token;
    if (typeof t === 'string' && t.length > 0) {
      return t.trim();
    }
  }

  return null;
}

@Injectable()
export class FirebaseGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseGuard.name);

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = extractIdToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'No token provided — use Authorization: Bearer <idToken> or JSON { "idToken": "..." }',
      );
    }

    try {
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(token);

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
      try {
        const payload = await verifyGoogleIdToken(token);
        request.user = {
          uid: payload.sub!,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: 'google',
        };
        return true;
      } catch (googleErr) {
        this.logger.debug(
          `Token verify: ${firebaseErr instanceof Error ? firebaseErr.message : firebaseErr} | ${googleErr instanceof Error ? googleErr.message : googleErr}`,
        );
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
}

/**
 * كما في منطقك: تحقق بـ audience كمصفوفة؛ إن فشل، إعادة المحاولة لكل معرف عميل (أندرويد/آيفون/ويب).
 */
async function verifyGoogleIdToken(token: string): Promise<TokenPayload> {
  const audience = getAllowedGoogleClientIds();

  if (audience.length === 0) {
    throw new Error(
      'No Google client IDs configured for ID token verification',
    );
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    if (payload) {
      return payload;
    }
  } catch {
    /* fall through — try each OAuth client id */
  }

  let lastErr: Error | undefined;
  for (const aud of audience) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: aud,
      });
      const payload = ticket.getPayload();
      if (payload) {
        return payload;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastErr ?? new Error('Failed to verify Google ID token');
}
