// Cola local de comprobantes de pago (demo).
// El comprobante queda "pendiente" hasta que el administrador lo aprueba
// desde el panel #admin. Aprobar activa Pro al usuario dueño del pago.
// LIMITACIÓN: localStorage es por navegador; el panel solo ve los pagos
// enviados en este mismo navegador.

import { activatePremium } from './auth';
import type { AuthResult } from './auth';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fileName: string;
  fileSize: number;
  imageDataUrl: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  status: PaymentStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface PaymentInput {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fileName: string;
  fileSize: number;
  imageDataUrl: string;
}

export const ADMIN_PASSCODE = 'studysnap-admin';
export const PAYMENTS_KEY = 'studysnap:payments:v1';
export const ADMIN_UNLOCK_KEY = 'studysnap:admin-unlocked:v1';
const PAYMENTS_EVENT = 'studysnap:payments-changed';
const MAX_PAYMENTS = 40;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function notifyPaymentsChange(): void {
  try {
    window.dispatchEvent(new Event(PAYMENTS_EVENT));
  } catch {
    // ignorar
  }
}

export function subscribeToPayments(callback: () => void): () => void {
  window.addEventListener(PAYMENTS_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(PAYMENTS_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function loadPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PaymentRecord[]) : [];
  } catch {
    return [];
  }
}

function savePayments(payments: PaymentRecord[]): void {
  const trimmed = payments.slice(0, MAX_PAYMENTS);
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Si el storage se llenó, descarta comprobantes ya revisados (más antiguos).
    const compact = trimmed.filter((p) => p.status === 'pending').slice(0, 15);
    try {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(compact));
    } catch {
      // último recurso: no guardar imágenes
      const withoutImages = compact.map((p) => ({ ...p, imageDataUrl: '' }));
      try {
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(withoutImages));
      } catch {
        // storage bloqueado
      }
    }
  }
}

/** IP pública del visitante (ipify). Si falla, usa 'local'. */
export async function getClientIp(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return 'local';
    const json = (await res.json()) as { ip?: string };
    return json.ip || 'local';
  } catch {
    return 'local';
  }
}

/**
 * Reduce la imagen antes de guardarla en localStorage.
 * Un comprobante de ~3 MB termina en ~100-250 KB.
 */
export async function compressImage(file: File, maxDim = 1100, quality = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No pude leer la imagen del comprobante.'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export async function createPayment(input: PaymentInput): Promise<PaymentRecord> {
  const ip = await getClientIp();
  const record: PaymentRecord = {
    id: makeId(),
    ...input,
    ip,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'desconocido',
    createdAt: new Date().toISOString(),
    status: 'pending',
    reviewedAt: null,
    reviewNote: null,
  };
  savePayments([record, ...loadPayments()]);
  notifyPaymentsChange();
  return record;
}

export function getPendingPaymentForUser(userId: string): PaymentRecord | null {
  return loadPayments().find((p) => p.userId === userId && p.status === 'pending') ?? null;
}

export function approvePayment(paymentId: string): AuthResult {
  const payments = loadPayments();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) return { ok: false, error: 'No encontré ese comprobante.' };
  if (payment.status !== 'pending') return { ok: false, error: 'Ese pago ya fue revisado.' };

  const result = activatePremium(payment.userId, {
    fileName: payment.fileName,
    size: payment.fileSize,
  });
  if (!result.ok) return result;

  const updated = payments.map((p) =>
    p.id === paymentId
      ? { ...p, status: 'approved' as const, reviewedAt: new Date().toISOString() }
      : p,
  );
  savePayments(updated);
  notifyPaymentsChange();
  return { ok: true, user: result.user };
}

export function rejectPayment(paymentId: string, note = ''): AuthResult {
  const payments = loadPayments();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) return { ok: false, error: 'No encontré ese comprobante.' };
  if (payment.status !== 'pending') return { ok: false, error: 'Ese pago ya fue revisado.' };

  const updated = payments.map((p) =>
    p.id === paymentId
      ? {
          ...p,
          status: 'rejected' as const,
          reviewedAt: new Date().toISOString(),
          reviewNote: note.trim().slice(0, 200) || null,
        }
      : p,
  );
  savePayments(updated);
  notifyPaymentsChange();
  return { ok: true };
}

export function isAdminUnlocked(): boolean {
  try {
    return localStorage.getItem(ADMIN_UNLOCK_KEY) === 'yes';
  } catch {
    return false;
  }
}

export function unlockAdmin(passcode: string): boolean {
  if (passcode.trim() !== ADMIN_PASSCODE) return false;
  try {
    localStorage.setItem(ADMIN_UNLOCK_KEY, 'yes');
  } catch {
    // ignorar
  }
  return true;
}

export function lockAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_UNLOCK_KEY);
  } catch {
    // ignorar
  }
}

export function formatPaymentDate(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function describeDevice(userAgent: string): string {
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iPhone / iPad';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Dispositivo desconocido';
}
