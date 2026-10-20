import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import type { AuthModalMode } from '../store/AuthContext';

export default function AuthModal() {
  const { authOpen, authMode, closeAuth, login, register } = useAuth();
  const [mode, setMode] = useState<AuthModalMode>(authMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authOpen) {
      setPassword('');
      setConfirm('');
      setError('');
      return;
    }
    setMode(authMode);
    setError('');
  }, [authOpen, authMode]);

  useEffect(() => {
    if (!authOpen) return;
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  function switchMode(next: AuthModalMode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register(name, email, password);
      if (!result.ok) {
        setError(result.error ?? 'No pude completar la operación.');
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setConfirm('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget) closeAuth();
    }}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button type="button" className="modal-close" onClick={closeAuth} aria-label="Cerrar">
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#EDE9FF', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 0.75rem',
          }}>
            {mode === 'login' ? '👋' : '✨'}
          </div>
          <h2 id="auth-modal-title" style={{ fontSize: '1.5rem', color: '#2C2855', marginBottom: '0.35rem' }}>
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
            {mode === 'login'
              ? 'Ingresa para seguir usando StudySnap.'
              : 'Regístrate para guardar tus apuntes y planes.'}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {mode === 'register' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span className="form-label">Nombre</span>
              <input
                ref={firstFieldRef}
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="form-label">Correo</span>
            <input
              ref={mode === 'login' ? firstFieldRef : undefined}
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span className="form-label">Contraseña</span>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {mode === 'register' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span className="form-label">Confirmar contraseña</span>
              <input
                className="form-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {error && <div className="form-error" role="alert">{error}</div>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '0.25rem' }}>
            {submitting
              ? 'Un momento…'
              : mode === 'login'
                ? 'Ingresar'
                : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="form-note" style={{ marginTop: '1rem', textAlign: 'center' }}>
          Demo local: tu cuenta se guarda solo en este navegador.
        </p>
      </div>
    </div>
  );
}
