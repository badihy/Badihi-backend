import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const googleClient = new OAuth2Client();

function getAllowedGoogleClientIds(): string[] {
  const fromList = (process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const ids = [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_ID_MOBILE]
    .filter(Boolean)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);

  return [...new Set([...ids, ...fromList])];
}

@Injectable()
export class FirebaseGuard implements CanActivate {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    const token = this.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        provider: decodedToken.firebase.sign_in_provider,
      };

      return true;
    } catch (firebaseErr) {
      try {
        const payload = await verifyGoogleIdToken(token);
        request.user = {
          uid: payload.sub,
          email: payload.email,
          name: payload.name,
          provider: 'google',
        };
        return true;
      } catch (googleErr) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }

  extractTokenFromHeader(header: string): string | null {
    if (!header) return null;
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }
}

async function verifyGoogleIdToken(token: string): Promise<TokenPayload> {
  const audience = getAllowedGoogleClientIds();

  if (audience.length === 0) {
    throw new Error('No Google client IDs configured for ID token verification');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Failed to verify Google ID token');
  }

  return payload;
}
