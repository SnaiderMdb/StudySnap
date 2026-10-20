import { useAuth } from '../store/AuthContext';
import { formatPlanExpiry, PREMIUM_DAYS, PREMIUM_PRICE_BOB } from '../lib/auth';

interface PlansProps {
  onNavigate: (section: 'inicio' | 'escanear' | 'estudiar' | 'progreso' | 'contacto' | 'planes') => void;
}

const PLANS = [
  {
    id: 'demo',
    emoji: '🎁',
    name: 'Demo',
    price: 'Gratis',
    period: 'sin cuenta',
    description: 'Prueba StudySnap antes de registrarte.',
    features: ['3 escaneos en total', 'Resumen, flashcards y quiz', 'Datos guardados en tu navegador'],
    highlight: false,
  },
  {
    id: 'free',
    emoji: '📚',
    name: 'Gratis',
    price: 'Bs 0',
    period: 'para siempre',
    description: 'Crea tu cuenta y estudia todos los días.',
    features: ['3 escaneos por día', 'Tus apuntes por cuenta', 'Acceso a flashcards y quizzes'],
    highlight: false,
  },
  {
    id: 'premium',
    emoji: '⚡',
    name: 'Pro',
    price: `Bs ${PREMIUM_PRICE_BOB}`,
    period: `cada ${PREMIUM_DAYS} días`,
    description: 'Para épocas de exámenes y estudio intenso.',
    features: ['Escaneos ilimitados', 'Todo lo del plan gratis', 'Activa tu plan al instante'],
    highlight: true,
  },
];

export default function Plans({ onNavigate }: PlansProps) {
  const { user, isPremium, pendingPayment, openAuth, openUpgrade } = useAuth();

  function handleCta(planId: string) {
    if (planId === 'demo') {
      onNavigate('escanear');
      return;
    }
    if (planId === 'free') {
      if (!user) openAuth('register');
      return;
    }
    openUpgrade();
  }

  return (
    <section id="planes" className="section" style={{ paddingTop: '7rem' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-block', background: '#EDE9FF', color: '#7C6CE6',
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            padding: '0.35rem 1rem', borderRadius: '999px', marginBottom: '1rem',
          }}>
            💳 Planes StudySnap
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#2C2855', marginBottom: '0.75rem' }}>
            Elige cómo quieres estudiar
          </h2>
          <p style={{ color: '#7C75A6', maxWidth: '520px', margin: '0 auto' }}>
            Empieza gratis, crea tu cuenta y mejora a Pro cuando necesites escanear sin límites.
          </p>
        </div>

        {user && (
          <div className="card" style={{
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', fontSize: '0.95rem' }}>
                Sesión iniciada como {user.name}
              </p>
              <p style={{ color: '#7C75A6', fontSize: '0.8rem' }}>
                {isPremium
                  ? `Plan Pro activo hasta ${formatPlanExpiry(user)}`
                  : pendingPayment
                    ? 'Comprobante enviado · en revisión por el administrador'
                    : 'Plan gratis · 3 escaneos por día'}
              </p>
            </div>
            <span style={{
              background: isPremium ? '#ECFDF5' : pendingPayment ? '#FEF3C7' : '#EDE9FF',
              color: isPremium ? '#047857' : pendingPayment ? '#B45309' : '#7C6CE6',
              fontWeight: 800, fontSize: '0.75rem', padding: '0.3rem 0.8rem',
              borderRadius: '999px', fontFamily: 'Nunito, sans-serif',
            }}>
              {isPremium ? 'PRO' : pendingPayment ? 'EN REVISIÓN' : 'GRATIS'}
            </span>
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.25rem', alignItems: 'stretch',
        }}>
          {PLANS.map((plan) => {
            const active = plan.id === 'premium' ? isPremium : plan.id === 'free' ? Boolean(user) : false;
            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: '1.75rem', display: 'flex', flexDirection: 'column',
                  border: plan.highlight ? '2px solid #7C6CE6' : '1px solid #E2DCFF',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <span style={{
                    position: 'absolute', top: '-0.7rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7C6CE6, #a78bfa)', color: 'white',
                    fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.75rem',
                    borderRadius: '999px', fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap',
                  }}>
                    RECOMENDADO
                  </span>
                )}

                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{plan.emoji}</div>
                <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', fontSize: '1.25rem' }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', margin: '0.35rem 0 0.5rem' }}>
                  <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: '#7C6CE6' }}>
                    {plan.price}
                  </span>
                  <span style={{ color: '#7C75A6', fontSize: '0.8rem' }}>{plan.period}</span>
                </div>
                <p style={{ color: '#7C75A6', fontSize: '0.85rem', marginBottom: '1rem' }}>{plan.description}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', gap: '0.5rem', color: '#5E568C', fontSize: '0.85rem' }}>
                      <span style={{ color: '#22C55E', fontWeight: 800 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto' }}>
                  {active ? (
                    <button type="button" className="btn-secondary" disabled style={{ width: '100%', opacity: 0.7, cursor: 'default' }}>
                      {plan.id === 'premium' ? 'Plan activo' : isPremium ? 'Incluido en Pro' : 'Plan actual'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={plan.highlight ? 'btn-primary' : 'btn-secondary'}
                      style={{ width: '100%' }}
                      onClick={() => handleCta(plan.id)}
                    >
                      {plan.id === 'demo'
                        ? 'Probar la demo'
                        : plan.id === 'free'
                          ? user ? 'Incluido en tu cuenta' : 'Crear cuenta gratis'
                          : isPremium ? 'Plan activo' : pendingPayment ? 'Ver estado del pago' : 'Hazte Pro'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', color: '#9891B8', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          Precios y pagos de demostración. El comprobante se verifica de forma simulada en este navegador.
        </p>
      </div>
    </section>
  );
}
