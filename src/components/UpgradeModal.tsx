import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../store/AuthContext';
import { formatPlanExpiry, PREMIUM_DAYS, PREMIUM_PLAN_NAME, PREMIUM_PRICE_BOB } from '../lib/auth';
import { formatPaymentDate } from '../lib/payments';

export default function UpgradeModal() {
  const { upgradeOpen, closeUpgrade, user, isPremium, pendingPayment, submitPayment } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!upgradeOpen) return;
    setFile(null);
    setPreview('');
    setError('');
    setSubmitting(false);
    setIsDragging(false);
  }, [upgradeOpen]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!upgradeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) closeUpgrade();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [upgradeOpen, closeUpgrade, submitting]);

  if (!upgradeOpen || !user) return null;

  function pickFile(next: File | null) {
    setError('');
    if (!next) return;
    if (!next.type.startsWith('image/')) {
      setError('Sube una imagen del comprobante (JPG, PNG, etc.).');
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 8 MB.');
      return;
    }
    setFile(next);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }

  async function handleConfirm() {
    if (!file) {
      setError('Primero sube la imagen de tu comprobante.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await submitPayment(file);
      if (!result.ok) {
        setError(result.error ?? 'No pude enviar el comprobante. Inténtalo otra vez.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const qrValue = `studysnap://pago?plan=pro&monto=${PREMIUM_PRICE_BOB}&ref=${user.id}`;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !submitting) closeUpgrade();
    }}>
      <div
        className="modal-panel wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={closeUpgrade}
          aria-label="Cerrar"
          disabled={submitting}
        >
          ✕
        </button>

        {isPremium ? (
          <div className="modal-success">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2 id="upgrade-modal-title" style={{ fontSize: '1.6rem', color: '#2C2855', marginBottom: '0.5rem' }}>
              Ya eres Pro
            </h2>
            <p style={{ color: '#7C75A6', marginBottom: '0.35rem' }}>
              Tienes escaneos ilimitados.
            </p>
            <p style={{
              display: 'inline-block', background: '#ECFDF5', color: '#047857',
              fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 0.9rem',
              borderRadius: '999px', margin: '0.75rem 0 1.5rem',
            }}>
              Activo hasta {formatPlanExpiry(user)}
            </p>
            <div>
              <button type="button" className="btn-primary" onClick={closeUpgrade}>
                Empezar a estudiar
              </button>
            </div>
          </div>
        ) : pendingPayment ? (
          <div className="modal-success">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧾</div>
            <h2 id="upgrade-modal-title" style={{ fontSize: '1.6rem', color: '#2C2855', marginBottom: '0.5rem' }}>
              Comprobante enviado
            </h2>
            <p style={{ color: '#7C75A6', marginBottom: '0.75rem' }}>
              Tu pago está <strong style={{ color: '#B45309' }}>en revisión</strong>. El administrador
              revisará el comprobante y activará tu plan Pro manualmente.
            </p>

            <div style={{
              background: '#F8F6FF', borderRadius: '1rem', padding: '1rem 1.15rem',
              textAlign: 'left', fontSize: '0.82rem', color: '#5E568C', margin: '0 0 1.25rem',
            }}>
              <p><strong>Cuenta:</strong> {user.email}</p>
              <p><strong>Monto:</strong> Bs {pendingPayment.amount}</p>
              <p><strong>Comprobante:</strong> {pendingPayment.fileName}</p>
              <p><strong>Enviado:</strong> {formatPaymentDate(pendingPayment.createdAt)}</p>
              <p><strong>Estado:</strong> Pendiente de aprobación</p>
            </div>

            <button type="button" className="btn-primary" onClick={closeUpgrade}>
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{
                display: 'inline-block', background: '#EDE9FF', color: '#7C6CE6',
                fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.8rem',
                padding: '0.3rem 0.85rem', borderRadius: '999px', marginBottom: '0.75rem',
              }}>
                ⚡ {PREMIUM_PLAN_NAME}
              </span>
              <h2 id="upgrade-modal-title" style={{ fontSize: '1.65rem', color: '#2C2855', marginBottom: '0.35rem' }}>
                Escaneos ilimitados
              </h2>
              <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
                Paga <strong style={{ color: '#7C6CE6' }}>Bs {PREMIUM_PRICE_BOB}</strong> y activa {PREMIUM_DAYS} días de Pro.
              </p>
            </div>

            <div className="qr-frame">
              <QRCodeSVG value={qrValue} size={168} bgColor="#FFFFFF" fgColor="#2C2855" level="M" />
              <p style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#7C75A6' }}>
                QR de demostración · Bs {PREMIUM_PRICE_BOB}
              </p>
            </div>

            <div style={{
              background: '#F8F6FF', borderRadius: '1rem', padding: '1rem 1.15rem',
              margin: '1.25rem 0', fontSize: '0.85rem', color: '#5E568C', lineHeight: 1.6,
            }}>
              <strong style={{ color: '#2C2855' }}>Instrucciones</strong>
              <ol style={{ margin: '0.4rem 0 0 1.1rem', padding: 0 }}>
                <li>Escanea el QR desde tu app bancaria.</li>
                <li>Paga Bs {PREMIUM_PRICE_BOB} a nombre de StudySnap.</li>
                <li>Sube una imagen del comprobante aquí abajo.</li>
                <li>El administrador revisará y activará tu plan.</li>
              </ol>
              <p style={{ marginTop: '0.5rem', color: '#9891B8', fontSize: '0.75rem' }}>
                Pago simulado: el comprobante queda en revisión manual.
              </p>
            </div>

            <div
              className={`receipt-drop ${isDragging ? 'drag-over' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Comprobante seleccionado" className="receipt-preview" />
                  <p style={{ fontSize: '0.8rem', color: '#2C2855', fontWeight: 600, marginTop: '0.5rem' }}>
                    {file?.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#7C75A6' }}>Haz clic para cambiar la imagen</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>🧾</div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2C2855' }}>
                    Sube tu comprobante
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#7C75A6' }}>
                    Arrastra una imagen o haz clic para elegirla
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && <div className="form-error" role="alert" style={{ marginTop: '0.85rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirm}
                disabled={submitting || !file}
                style={{ flex: 1, minWidth: '160px' }}
              >
                {submitting ? 'Enviando comprobante…' : 'Enviar a revisión'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeUpgrade}
                disabled={submitting}
              >
                Ahora no
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
