import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { formatPlanExpiry } from '../lib/auth';

export default function UserMenu() {
  const { user, isPremium, pendingPayment, openAuth, openUpgrade, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (!user) {
    return (
      <button
        type="button"
        className="btn-secondary"
        style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
        onClick={() => openAuth('login')}
      >
        Ingresar
      </button>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1px solid #E2DCFF',
          borderRadius: '999px', padding: '0.25rem 0.65rem 0.25rem 0.25rem',
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        }}
      >
        <span style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C6CE6, #a78bfa)',
          color: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
        }}>
          {initial}
        </span>
        <span className="user-menu-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2C2855' }}>
          {user.name.split(' ')[0]}
        </span>
        {isPremium && (
          <span style={{
            background: '#ECFDF5', color: '#047857', fontSize: '0.65rem',
            fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px',
          }}>
            PRO
          </span>
        )}
        {!isPremium && pendingPayment && (
          <span style={{
            background: '#FEF3C7', color: '#B45309', fontSize: '0.65rem',
            fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '999px',
          }}>
            EN REVISIÓN
          </span>
        )}
        <span style={{ fontSize: '0.6rem', color: '#7C75A6' }}>▼</span>
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECFF' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', fontSize: '0.9rem' }}>
              {user.name}
            </p>
            <p style={{ color: '#7C75A6', fontSize: '0.75rem', wordBreak: 'break-all' }}>{user.email}</p>
            <span style={{
              display: 'inline-block', marginTop: '0.4rem',
              background: isPremium ? '#ECFDF5' : pendingPayment ? '#FEF3C7' : '#EDE9FF',
              color: isPremium ? '#047857' : pendingPayment ? '#B45309' : '#7C6CE6',
              fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem',
              borderRadius: '999px',
            }}>
              {isPremium ? 'Plan Pro' : pendingPayment ? 'Pago en revisión' : 'Plan gratis'}
            </span>
            {isPremium && user.planExpiresAt && (
              <p style={{ color: '#7C75A6', fontSize: '0.7rem', marginTop: '0.35rem' }}>
                Activo hasta {formatPlanExpiry(user)}
              </p>
            )}
          </div>

          {!isPremium && !pendingPayment && (
            <button
              type="button"
              role="menuitem"
              className="dropdown-item"
              onClick={() => { setOpen(false); openUpgrade(); }}
            >
              ⚡ Hazte Pro · Bs 20/mes
            </button>
          )}
          {!isPremium && pendingPayment && (
            <button
              type="button"
              role="menuitem"
              className="dropdown-item"
              onClick={() => { setOpen(false); openUpgrade(); }}
              style={{ color: '#B45309' }}
            >
              🧾 Pago en revisión
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className="dropdown-item danger"
            onClick={() => { setOpen(false); logout(); }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
