// Cuota local de StudySnap (demo):
// - Invitado: 3 escaneos gratis en total.
// - Cuenta gratis: 3 escaneos por día.
// - Premium: ilimitado.
// Todo vive en localStorage; es un límite de demostración, no seguridad real.

import type { PublicUser } from './auth';

export const GUEST_LIMIT = 3;
export const FREE_DAILY_LIMIT = 3;

const QUOTA_KEY = 'studysnap:quota:v2';

interface QuotaStore {
  guestUsed: number;
  users: Record<string, { date: string; used: number }>;
}

export interface QuotaStatus {
  identity: 'guest' | 'free' | 'premium';
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  allowed: boolean;
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function loadQuota(): QuotaStore {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { guestUsed: 0, users: {} };
    const parsed = JSON.parse(raw) as Partial<QuotaStore>;
    return {
      guestUsed: typeof parsed.guestUsed === 'number' ? parsed.guestUsed : 0,
      users: typeof parsed.users === 'object' && parsed.users !== null ? parsed.users : {},
    };
  } catch {
    return { guestUsed: 0, users: {} };
  }
}

function saveQuota(q: QuotaStore): void {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
  } catch {
    // storage bloqueado: no rompemos la app
  }
}

function userDailyUsed(q: QuotaStore, userId: string): number {
  const entry = q.users[userId];
  return entry && entry.date === todayKey() ? entry.used : 0;
}

export function checkQuota(user: PublicUser | null): QuotaStatus {
  if (user?.isPremium) {
    return {
      identity: 'premium',
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
      allowed: true,
    };
  }

  const q = loadQuota();
  if (!user) {
    return {
      identity: 'guest',
      used: q.guestUsed,
      limit: GUEST_LIMIT,
      remaining: Math.max(0, GUEST_LIMIT - q.guestUsed),
      unlimited: false,
      allowed: q.guestUsed < GUEST_LIMIT,
    };
  }

  const used = userDailyUsed(q, user.id);
  return {
    identity: 'free',
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    unlimited: false,
    allowed: used < FREE_DAILY_LIMIT,
  };
}

export function recordUpload(user: PublicUser | null): QuotaStatus {
  if (user?.isPremium) return checkQuota(user);

  const q = loadQuota();
  if (!user) {
    q.guestUsed += 1;
  } else {
    const used = userDailyUsed(q, user.id);
    q.users[user.id] = { date: todayKey(), used: used + 1 };
  }
  saveQuota(q);
  return checkQuota(user);
}

export function describeQuota(quota: QuotaStatus): string {
  if (quota.unlimited) return '♾️ Plan Pro: escaneos ilimitados';
  if (quota.identity === 'guest') {
    return quota.remaining && quota.remaining > 0
      ? `📤 Demo: te quedan ${quota.remaining} de ${quota.limit} escaneos`
      : '🚫 Demo terminada: crea una cuenta para seguir';
  }
  return quota.remaining && quota.remaining > 0
    ? `📤 Plan gratis: te quedan ${quota.remaining} de ${quota.limit} escaneos hoy`
    : '🚫 Límite diario alcanzado: vuelve mañana o hazte Pro';
}
