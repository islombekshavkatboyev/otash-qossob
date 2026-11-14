import { NextRequest, NextResponse } from 'next/server';
import { createToken, TOKEN_NAME } from '../../../lib/auth';

// In-memory rate limiting — serverda saqlanadi
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 daqiqa

// Timing-safe string taqqoslash
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) {
    // Baribir loop — timing attack oldini olish
    let diff = 0;
    for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ (bBytes[i % bBytes.length] || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit tekshirish
  const now = Date.now();
  const record = attempts.get(ip);
  if (record) {
    if (record.lockedUntil > now) {
      const remainingMs = record.lockedUntil - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        { error: `Juda ko'p urinish. ${remainingMin} daqiqadan so'ng qayta urining.`, locked: true },
        { status: 429 }
      );
    }
    if (record.lockedUntil <= now) {
      attempts.delete(ip);
    }
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Noto\'g\'ri so\'rov.' }, { status: 400 });
  }

  const { username = '', password = '' } = body;
  const expectedUsername = process.env.ADMIN_USERNAME || '';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  const usernameOk = timingSafeEqual(username, expectedUsername);
  const passwordOk = timingSafeEqual(password, expectedPassword);

  if (!usernameOk || !passwordOk) {
    const rec = attempts.get(ip) || { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockedUntil = now + LOCKOUT_MS;
    }
    attempts.set(ip, rec);
    const remaining = Math.max(0, MAX_ATTEMPTS - rec.count);
    return NextResponse.json(
      {
        error: rec.lockedUntil > 0
          ? 'Hisob bloklandi. 15 daqiqadan so\'ng urinib ko\'ring.'
          : `Login yoki parol noto'g'ri. ${remaining} ta urinish qoldi.`,
        remaining,
        locked: rec.lockedUntil > 0,
      },
      { status: 401 }
    );
  }

  // Muvaffaqiyatli kirish
  attempts.delete(ip);
  const token = await createToken(username);

  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400,
    path: '/',
  });
  return response;
}

