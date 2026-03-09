import { timingSafeEqual } from 'crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSiteSettings } from '@/lib/store';

const ADMIN_COOKIE = 'atelophobia_admin_session';
const SESSION_VALUE = 'authenticated';

export const DEFAULT_ADMIN_CODE = process.env.ADMIN_CODE || '1508';

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthenticated() {
  return cookies().get(ADMIN_COOKIE)?.value === SESSION_VALUE;
}

export function requireAdminAuth() {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login');
  }
}

export function createAdminSession() {
  cookies().set(ADMIN_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export async function validateAdminCode(code: string) {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    return false;
  }

  const settings = await getSiteSettings();
  const expectedCode = settings.adminCode?.trim() || DEFAULT_ADMIN_CODE;

  return safeCompare(normalizedCode, expectedCode);
}
