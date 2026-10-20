// ============================================================
// auth.ts — Cuentas locales de StudySnap (solo demo)
// Los usuarios viven en localStorage de este navegador.
// Las contraseñas se guardan con PBKDF2 + salt, nunca en texto plano.
// LIMITACIÓN: sin backend, cualquiera con DevTools puede alterar el
// localStorage. Para producción real se necesita servidor + base de datos.
// ============================================================

export type PlanId = 'free' | 'premium';

export const PREMIUM_PRICE_BOB = 20;
export const PREMIUM_DAYS = 30;
export const PREMIUM_PLAN_NAME = 'StudySnap Pro';

const USERS_KEY = 'studysnap:users:v2';
const SESSION_KEY = 'studysnap:session:v2';
const AUTH_EVENT = 'studysnap:auth-changed';
const PBKDF2_ITERATIONS = 120_000;

interface ReceiptRecord {
  id: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  plan: PlanId;
  planExpiresAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  receipts: ReceiptRecord[];
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  planExpiresAt: string | null;
  createdAt: string;
  isPremium: boolean;
}

export interface AuthResult {
  ok: boolean;
  user?: PublicUser;
  error?: string;
}

function notifyAuthChange(): void {
  try {
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch {
    // entorno sin window (SSR/tests): ignorar
  }
}

export function subscribeToAuth(callback: () => void): () => void {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) return new Uint8Array(new ArrayBuffer(0));
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function makeSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  if (!crypto.subtle) {
    throw new Error('Tu navegador no permite guardar contraseñas de forma segura.');
  }
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserRecord[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isPremiumActive(user: UserRecord): boolean {
  if (user.plan !== 'premium') return false;
  if (!user.planExpiresAt) return false;
  return new Date(user.planExpiresAt).getTime() > Date.now();
}

function normalizeUser(user: UserRecord): UserRecord {
  if (user.plan === 'premium' && !isPremiumActive(user)) {
    return { ...user, plan: 'free', planExpiresAt: null };
  }
  return user;
}

function toPublic(user: UserRecord): PublicUser {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    name: normalized.name,
    email: normalized.email,
    plan: normalized.plan,
    planExpiresAt: normalized.planExpiresAt,
    createdAt: normalized.createdAt,
    isPremium: isPremiumActive(normalized),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function setSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function getSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveNormalizedUser(updated: UserRecord): void {
  const users = loadUsers().map((u) => (u.id === updated.id ? updated : u));
  saveUsers(users);
}

export function getCurrentUser(): PublicUser | null {
  const userId = getSessionUserId();
  if (!userId) return null;
  const found = loadUsers().find((u) => u.id === userId);
  if (!found) {
    clearSession();
    return null;
  }
  const normalized = normalizeUser(found);
  if (normalized.plan !== found.plan) saveNormalizedUser(normalized);
  return toPublic(normalized);
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2) return { ok: false, error: 'Escribe tu nombre (mínimo 2 letras).' };
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Escribe un correo válido.' };
  if (password.length < 6) return { ok: false, error: 'La contraseña necesita al menos 6 caracteres.' };

  const users = loadUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    return { ok: false, error: 'Ya existe una cuenta con ese correo. Inicia sesión.' };
  }

  try {
    const salt = makeSalt();
    const passwordHash = await hashPassword(password, salt);
    const user: UserRecord = {
      id: makeId(),
      name: cleanName.slice(0, 60),
      email: cleanEmail,
      passwordHash,
      salt,
      plan: 'free',
      planExpiresAt: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      receipts: [],
    };
    saveUsers([...users, user]);
    setSession(user.id);
    notifyAuthChange();
    return { ok: true, user: toPublic(user) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No pude crear la cuenta.' };
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Escribe un correo válido.' };
  if (!password) return { ok: false, error: 'Escribe tu contraseña.' };

  const users = loadUsers();
  const found = users.find((u) => u.email === cleanEmail);
  if (!found) return { ok: false, error: 'No encontré una cuenta con ese correo.' };

  try {
    const hash = await hashPassword(password, found.salt);
    if (hash !== found.passwordHash) {
      return { ok: false, error: 'Contraseña incorrecta. Inténtalo otra vez.' };
    }
    const normalized = normalizeUser({ ...found, lastLoginAt: new Date().toISOString() });
    saveNormalizedUser(normalized);
    setSession(normalized.id);
    notifyAuthChange();
    return { ok: true, user: toPublic(normalized) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No pude iniciar sesión.' };
  }
}

export function logout(): void {
  clearSession();
  notifyAuthChange();
}

export interface ReceiptInput {
  fileName: string;
  size: number;
}

/** Activa el plan Pro durante 30 días (pago simulado). */
export function activatePremium(userId: string, receipt: ReceiptInput): AuthResult {
  const users = loadUsers();
  const found = users.find((u) => u.id === userId);
  if (!found) return { ok: false, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };

  const now = new Date();
  const expires = new Date(now.getTime() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
  const updated: UserRecord = {
    ...found,
    plan: 'premium',
    planExpiresAt: expires.toISOString(),
    receipts: [
      {
        id: makeId(),
        fileName: receipt.fileName.slice(0, 160),
        size: receipt.size,
        uploadedAt: now.toISOString(),
      },
      ...found.receipts,
    ].slice(0, 10),
  };
  saveNormalizedUser(updated);
  notifyAuthChange();
  return { ok: true, user: toPublic(updated) };
}

export function formatPlanExpiry(user: PublicUser | null): string {
  if (!user?.planExpiresAt) return '';
  return new Date(user.planExpiresAt).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export { AUTH_EVENT };
