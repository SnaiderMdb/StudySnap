import { useEffect, useState } from 'react';
import {
  ADMIN_PASSCODE,
  approvePayment,
  describeDevice,
  formatPaymentDate,
  isAdminUnlocked,
  loadPayments,
  lockAdmin,
  rejectPayment,
  subscribeToPayments,
  unlockAdmin,
} from '../lib/payments';
import type { PaymentRecord, PaymentStatus } from '../lib/payments';

type Filter = 'pending' | 'all' | 'approved' | 'rejected';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'all', label: 'Todos' },
  { id: 'approved', label: 'Aprobados' },
  { id: 'rejected', label: 'Rechazados' },
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

interface AdminDashboardProps {
  onExit: () => void;
}

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked());
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadPayments());
  const [filter, setFilter] = useState<Filter>('pending');
  const [viewer, setViewer] = useState<PaymentRecord | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!unlocked) return;
    setPayments(loadPayments());
    return subscribeToPayments(() => setPayments(loadPayments()));
  }, [unlocked]);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewer(null);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [viewer]);

  function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    if (unlockAdmin(passcode)) {
      setUnlocked(true);
      setLoginError('');
      setPasscode('');
      setPayments(loadPayments());
    } else {
      setLoginError('Clave incorrecta. Inténtalo de nuevo.');
    }
  }

  function handleLock() {
    lockAdmin();
    setUnlocked(false);
    setViewer(null);
  }

  function handleApprove(payment: PaymentRecord) {
    setActionError('');
    const result = approvePayment(payment.id);
    if (!result.ok) {
      setActionError(result.error ?? 'No pude aprobar el pago.');
      return;
    }
    setPayments(loadPayments());
  }

  function handleReject(payment: PaymentRecord) {
    setActionError('');
    const result = rejectPayment(payment.id, notes[payment.id] ?? '');
    if (!result.ok) {
      setActionError(result.error ?? 'No pude rechazar el pago.');
      return;
    }
    setPayments(loadPayments());
  }

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  const visible = payments.filter((p) => (filter === 'all' ? true : p.status === filter));

  if (!unlocked) {
    return (
      <section className="section" style={{ paddingTop: '7rem' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <h1 style={{ fontSize: '1.6rem', color: '#2C2855', marginBottom: '0.35rem' }}>
                Panel de administración
              </h1>
              <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
                Ingresa la clave para revisar los comprobantes de pago.
              </p>
            </div>

            <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span className="form-label">Clave de administrador</span>
                <input
                  className="form-input"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  required
                />
              </label>
              {loginError && <div className="form-error" role="alert">{loginError}</div>}
              <button type="submit" className="btn-primary">Entrar al panel</button>
            </form>

            <p className="form-note" style={{ marginTop: '1rem', textAlign: 'center' }}>
              Clave de demostración: <strong>{ADMIN_PASSCODE}</strong>
            </p>
            <p style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={onExit}
                style={{ background: 'none', border: 'none', color: '#7C75A6', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Volver a StudySnap
              </button>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" style={{ paddingTop: '6.5rem' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem',
        }}>
          <div>
            <span style={{
              display: 'inline-block', background: '#2C2855', color: 'white',
              fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.75rem',
              padding: '0.3rem 0.8rem', borderRadius: '999px', marginBottom: '0.6rem',
            }}>
              ADMIN
            </span>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: '#2C2855', marginBottom: '0.25rem' }}>
              Aprobación de pagos
            </h1>
            <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
              Revisa el comprobante, la cuenta y los datos de conexión antes de activar Pro.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={onExit}>
              Ir a StudySnap
            </button>
            <button type="button" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={handleLock}>
              Bloquear panel
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Pendientes', value: pendingCount, color: '#B45309', bg: '#FEF3C7' },
            { label: 'Aprobados', value: approvedCount, color: '#047857', bg: '#ECFDF5' },
            { label: 'Rechazados', value: rejectedCount, color: '#B91C1C', bg: '#FEF2F2' },
            { label: 'Total', value: payments.length, color: '#7C6CE6', bg: '#EDE9FF' },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: '1rem 1.15rem', background: stat.bg, borderColor: 'transparent' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.7rem', color: stat.color, lineHeight: 1.1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#5E568C', fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              style={{
                border: '1px solid ' + (filter === item.id ? '#7C6CE6' : '#E2DCFF'),
                background: filter === item.id ? '#EDE9FF' : 'white',
                color: filter === item.id ? '#7C6CE6' : '#7C75A6',
                fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                fontSize: '0.8rem', padding: '0.4rem 0.9rem',
                borderRadius: '999px', cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{actionError}</div>
        )}

        {visible.length === 0 ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', color: '#2C2855', fontSize: '1.1rem', marginBottom: '0.3rem' }}>
              No hay comprobantes aquí
            </h2>
            <p style={{ color: '#7C75A6', fontSize: '0.85rem' }}>
              Los pagos enviados desde este navegador aparecerán en esta lista.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visible.map((payment) => (
              <div key={payment.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', fontSize: '1.05rem' }}>
                        {payment.userName}
                      </h2>
                      <span className={`admin-badge ${payment.status}`}>
                        {STATUS_LABEL[payment.status]}
                      </span>
                    </div>
                    <p style={{ color: '#7C6CE6', fontSize: '0.85rem', fontWeight: 600 }}>{payment.userEmail}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#2C2855', fontSize: '1.25rem' }}>
                      Bs {payment.amount}
                    </p>
                    <p style={{ color: '#7C75A6', fontSize: '0.75rem' }}>{formatPaymentDate(payment.createdAt)}</p>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '0.6rem', background: '#F8F6FF', borderRadius: '0.9rem',
                  padding: '0.9rem 1rem', marginBottom: '1rem', fontSize: '0.8rem',
                }}>
                  <div><span style={{ color: '#9891B8' }}>Cuenta: </span><span style={{ color: '#2C2855', wordBreak: 'break-all' }}>{payment.userId}</span></div>
                  <div><span style={{ color: '#9891B8' }}>IP: </span><span style={{ color: '#2C2855', fontWeight: 600 }}>{payment.ip}</span></div>
                  <div><span style={{ color: '#9891B8' }}>Dispositivo: </span><span style={{ color: '#2C2855' }}>{describeDevice(payment.userAgent)}</span></div>
                  <div><span style={{ color: '#9891B8' }}>Archivo: </span><span style={{ color: '#2C2855' }}>{payment.fileName} ({Math.round(payment.fileSize / 1024)} KB)</span></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#9891B8' }}>Navegador: </span>
                    <span style={{ color: '#7C75A6', fontSize: '0.72rem' }}>{payment.userAgent}</span>
                  </div>
                  {payment.reviewedAt && (
                    <div><span style={{ color: '#9891B8' }}>Revisado: </span><span style={{ color: '#2C2855' }}>{formatPaymentDate(payment.reviewedAt)}</span></div>
                  )}
                  {payment.reviewNote && (
                    <div><span style={{ color: '#9891B8' }}>Nota: </span><span style={{ color: '#2C2855' }}>{payment.reviewNote}</span></div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="admin-receipt"
                    onClick={() => setViewer(payment)}
                    title="Ver comprobante"
                  >
                    {payment.imageDataUrl ? (
                      <img src={payment.imageDataUrl} alt={`Comprobante de ${payment.userName}`} />
                    ) : (
                      <span style={{ color: '#7C75A6', fontSize: '0.75rem' }}>Sin imagen</span>
                    )}
                    <span>Ver comprobante</span>
                  </button>

                  {payment.status === 'pending' ? (
                    <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Nota opcional (motivo de rechazo, referencia…)"
                        value={notes[payment.id] ?? ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                        style={{ fontSize: '0.82rem', padding: '0.55rem 0.8rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
                          onClick={() => handleApprove(payment)}
                        >
                          ✓ Aprobar y activar Pro
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', color: '#B91C1C', borderColor: '#FECACA' }}
                          onClick={() => handleReject(payment)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center' }}>
                      <p style={{ color: '#7C75A6', fontSize: '0.8rem' }}>
                        {payment.status === 'approved'
                          ? 'Pago aprobado: el estudiante ya tiene plan Pro.'
                          : 'Pago rechazado: el estudiante no recibió acceso.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: '#9891B8', fontSize: '0.75rem', marginTop: '1.5rem', textAlign: 'center' }}>
          Demo local: los pagos se guardan en este navegador. Para recibir comprobantes de otros
          dispositivos hace falta un backend.
        </p>
      </div>

      {viewer && (
        <div className="modal-overlay" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setViewer(null);
        }}>
          <div className="modal-panel wide" role="dialog" aria-modal="true" aria-label="Comprobante de pago">
            <button type="button" className="modal-close" onClick={() => setViewer(null)} aria-label="Cerrar">✕</button>
            <h2 style={{ fontSize: '1.2rem', color: '#2C2855', marginBottom: '0.25rem' }}>
              Comprobante de {viewer.userName}
            </h2>
            <p style={{ color: '#7C75A6', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
              {viewer.userEmail} · IP {viewer.ip} · Bs {viewer.amount}
            </p>
            {viewer.imageDataUrl ? (
              <img
                src={viewer.imageDataUrl}
                alt={`Comprobante de ${viewer.userName}`}
                style={{ width: '100%', borderRadius: '0.9rem', border: '1px solid #E2DCFF' }}
              />
            ) : (
              <p style={{ color: '#B91C1C', fontSize: '0.85rem' }}>No se guardó la imagen de este comprobante.</p>
            )}
            <p style={{ color: '#9891B8', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              {viewer.fileName} · {Math.round(viewer.fileSize / 1024)} KB · Enviado {formatPaymentDate(viewer.createdAt)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
