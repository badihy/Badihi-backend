import { config as loadEnv } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

loadEnv();

const googleClient = new OAuth2Client();

function getExpectedGoogleAudience(): string {
  const audience = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!audience) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  return audience;
}

function extractTokenFromText(text: string): string {
  const labeledMatch = text.match(/Here:\s*idToken\s*\r?\n\r?\n([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+)/);
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const rawJwtMatch = text.match(/([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+)/);
  if (rawJwtMatch) {
    return rawJwtMatch[1].trim();
  }

  throw new Error('No JWT token found in the provided input');
}

function resolveTokenFromInput(inputArg?: string): string {
  if (!inputArg) {
    const defaultPath = path.resolve(process.cwd(), 'Warnings.txt');
    if (!fs.existsSync(defaultPath)) {
      throw new Error('No input provided and Warnings.txt was not found in the project root');
    }
    return extractTokenFromText(fs.readFileSync(defaultPath, 'utf8'));
  }

  const resolvedPath = path.resolve(process.cwd(), inputArg);
  if (fs.existsSync(resolvedPath)) {
    return extractTokenFromText(fs.readFileSync(resolvedPath, 'utf8'));
  }

  return extractTokenFromText(inputArg);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token is not a valid JWT with 3 parts');
  }

  const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(decoded) as Record<string, unknown>;
}

async function verifyWithGoogle(token: string): Promise<TokenPayload> {
  const audience = getExpectedGoogleAudience();

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google verification succeeded but returned no payload');
  }

  if (payload.aud !== audience) {
    throw new Error('Google token aud does not match GOOGLE_CLIENT_ID');
  }

  return payload;
}

async function main() {
  const inputArg = process.argv[2];
  const token = resolveTokenFromInput(inputArg);
  const payload = decodeJwtPayload(token);
  const exp = typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;

  console.log('Token summary');
  console.log(JSON.stringify({
    length: token.length,
    parts: token.split('.').length,
    alg: token.split('.')[0] ? JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8')).alg : undefined,
    iss: payload.iss,
    aud: payload.aud,
    azp: payload.azp,
    sub: payload.sub,
    email: payload.email,
    iat: payload.iat,
    exp: payload.exp,
    expIso: exp?.toISOString(),
    expiredNow: exp ? Date.now() > exp.getTime() : null,
  }, null, 2));

  try {
    const googlePayload = await verifyWithGoogle(token);
    console.log('\nGoogle verify');
    console.log(JSON.stringify({
      ok: true,
      aud: googlePayload.aud,
      azp: googlePayload.azp,
      sub: googlePayload.sub,
      email: googlePayload.email,
      exp: googlePayload.exp,
    }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('\nGoogle verify');
    console.log(JSON.stringify({ ok: false, message }, null, 2));
    process.exitCode = 1;
  }
}

void main();
