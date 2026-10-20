import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  login as loginLocal,
  logout as logoutLocal,
  register as registerLocal,
  subscribeToAuth,
} from '../lib/auth';
import type { AuthResult, PublicUser } from '../lib/auth';
import { PREMIUM_PRICE_BOB } from '../lib/auth';
import {
  compressImage,
  createPayment,
  getPendingPaymentForUser,
  subscribeToPayments,
} from '../lib/payments';
import type { PaymentRecord } from '../lib/payments';

export type AuthModalMode = 'login' | 'register';

export interface PaymentSubmitResult {
  ok: boolean;
  error?: string;
  payment?: PaymentRecord;
}

interface AuthContextValue {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  pendingPayment: PaymentRecord | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  submitPayment: (file: File) => Promise<PaymentSubmitResult>;
  authOpen: boolean;
  authMode: AuthModalMode;
  openAuth: (mode?: AuthModalMode) => void;
  closeAuth: () => void;
  upgradeOpen: boolean;
  openUpgrade: () => void;
  closeUpgrade: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialPending(): PaymentRecord | null {
  const current = getCurrentUser();
  return current ? getPendingPaymentForUser(current.id) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => getCurrentUser());
  const [pendingPayment, setPendingPayment] = useState<PaymentRecord | null>(initialPending);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>('login');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pendingUpgrade = useRef(false);

  const refresh = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setPendingPayment(current ? getPendingPaymentForUser(current.id) : null);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeToAuth(refresh);
  }, [refresh]);

  useEffect(() => subscribeToPayments(refresh), [refresh]);

  useEffect(() => {
    if (!upgradeOpen) return;
    if (!user) setUpgradeOpen(false);
  }, [upgradeOpen, user]);

  const openAuth = useCallback((mode: AuthModalMode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    pendingUpgrade.current = false;
  }, []);

  const openUpgrade = useCallback(() => {
    if (!getCurrentUser()) {
      pendingUpgrade.current = true;
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    setUpgradeOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginLocal(email, password);
    if (result.ok && result.user) {
      setUser(result.user);
      setPendingPayment(getPendingPaymentForUser(result.user.id));
      setAuthOpen(false);
      if (pendingUpgrade.current) {
        pendingUpgrade.current = false;
        setUpgradeOpen(true);
      }
    }
    return result;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerLocal(name, email, password);
    if (result.ok && result.user) {
      setUser(result.user);
      setPendingPayment(null);
      setAuthOpen(false);
      if (pendingUpgrade.current) {
        pendingUpgrade.current = false;
        setUpgradeOpen(true);
      }
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutLocal();
    setUser(null);
    setPendingPayment(null);
    setUpgradeOpen(false);
  }, []);

  const submitPayment = useCallback(async (file: File) => {
    const current = getCurrentUser();
    if (!current) {
      return { ok: false, error: 'Inicia sesión para enviar tu comprobante.' };
    }
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Sube una imagen del comprobante (JPG, PNG, etc.).' };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false, error: 'La imagen es muy grande. Máximo 8 MB.' };
    }
    if (getPendingPaymentForUser(current.id)) {
      return {
        ok: false,
        error: 'Ya tienes un comprobante en revisión. El administrador lo revisará pronto.',
      };
    }

    try {
      const imageDataUrl = await compressImage(file);
      const payment = await createPayment({
        userId: current.id,
        userName: current.name,
        userEmail: current.email,
        amount: PREMIUM_PRICE_BOB,
        fileName: file.name,
        fileSize: file.size,
        imageDataUrl,
      });
      setPendingPayment(payment);
      return { ok: true, payment };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'No pude enviar el comprobante.',
      };
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPremium: Boolean(user?.isPremium),
      pendingPayment,
      login,
      register,
      logout,
      submitPayment,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      upgradeOpen,
      openUpgrade,
      closeUpgrade,
    }),
    [
      user,
      pendingPayment,
      login,
      register,
      logout,
      submitPayment,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      upgradeOpen,
      openUpgrade,
      closeUpgrade,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
