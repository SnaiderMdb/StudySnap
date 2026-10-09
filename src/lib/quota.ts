// Cuota diaria: 5 apuntes por IP por día — control en el frontend.
// Cómo funciona: obtiene la IP pública (ipify, gratis sin key) y guarda el
// conteo por IP+fecha en localStorage. Es un freno honesto contra uso casual,
// NO una barrera de seguridad: alguien con DevTools puede borrar el
// localStorage o usar incógnito. Para un límite imposible de evadir se
// necesita el proxy en servidor (/api/generate) con la key escondida.

export const DAILY_LIMIT = 5;
const QUOTA_KEY = 'studysnap:quota:v1';

interface QuotaMap {
  [ip: string]: { date: string; count: number };
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function loadQuota(): QuotaMap {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveQuota(q: QuotaMap): void {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
  } catch {
    // storage bloqueado: no rompemos la app
  }
}

/** IP pública del visitante (ipify gratis). Si falla, usa 'local'. */
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

export interface QuotaStatus {
  ip: string;
  used: number;
  remaining: number;
  allowed: boolean;
}

/** Lee la cuota actual sin consumir. */
export async function checkQuota(): Promise<QuotaStatus> {
  const ip = await getClientIp();
  const q = loadQuota();
  const entry = q[ip];
  const today = todayKey();
  const used = entry && entry.date === today ? entry.count : 0;
  return { ip, used, remaining: Math.max(0, DAILY_LIMIT - used), allowed: used < DAILY_LIMIT };
}

/** Registra una subida. Devuelve el estado actualizado. */
export async function recordUpload(): Promise<QuotaStatus> {
  const ip = await getClientIp();
  const q = loadQuota();
  const today = todayKey();
  const entry = q[ip];
  const used = entry && entry.date === today ? entry.count : 0;
  q[ip] = { date: today, count: used + 1 };
  // Limpieza: guarda solo los últimos 200 registros
  const keys = Object.keys(q);
  if (keys.length > 200) {
    keys.slice(0, keys.length - 200).forEach((k) => delete q[k]);
  }
  saveQuota(q);
  const total = used + 1;
  return { ip, used: total, remaining: Math.max(0, DAILY_LIMIT - total), allowed: total < DAILY_LIMIT };
}
