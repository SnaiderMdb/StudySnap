// ============================================================
// Home.tsx — Sección de inicio de StudySnap
// Muestra el mensaje principal y el flujo de la plataforma
// ============================================================

// Props para la función de navegación
interface HomeProps {
  onNavigate: (section: 'inicio' | 'escanear' | 'estudiar' | 'progreso' | 'contacto') => void;
}

// Datos de los pasos del proceso principal
const STEPS = [
  {
    emoji: '📸',
    title: 'Sube tus apuntes',
    description: 'Fotografía o sube un archivo de tus apuntes escritos a mano o impresos.',
    color: '#EDE9FF',
    accent: '#7C6CE6',
  },
  {
    emoji: '✨',
    title: 'Organiza la información',
    description: 'StudySnap estructura el contenido en un resumen claro y ordenado automáticamente.',
    color: '#E0F2FE',
    accent: '#0EA5E9',
  },
  {
    emoji: '🧠',
    title: 'Estudia con flashcards y quizzes',
    description: 'Refuerza tu aprendizaje con tarjetas de memoria y cuestionarios interactivos.',
    color: '#F0FDF4',
    accent: '#22C55E',
  },
];

// Tarjetas de características
const FEATURES = [
  { icon: '📷', title: 'Escaneo rápido', desc: 'Sube fotos de tus apuntes en segundos' },
  { icon: '📋', title: 'Resúmenes claros', desc: 'La información organizada de forma fácil de leer' },
  { icon: '🃏', title: 'Flashcards', desc: 'Memoriza conceptos clave con tarjetas interactivas' },
  { icon: '🎯', title: 'Quizzes', desc: 'Evalúa tu conocimiento con preguntas de opción múltiple' },
];

export default function Home({ onNavigate }: HomeProps) {
  return (
    <section id="inicio" className="section" style={{ paddingTop: '7rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ===== HERO ===== */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>

          {/* Etiqueta pequeña */}
          <span style={{
            display: 'inline-block',
            background: '#EDE9FF',
            color: '#7C6CE6',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            marginBottom: '1.5rem',
            letterSpacing: '0.05em',
          }}>
            ✦ Plataforma educativa para estudiantes
          </span>

          {/* Título principal */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 900,
            color: '#2C2855',
            marginBottom: '1.25rem',
            lineHeight: 1.15,
          }}>
            Convierte tus apuntes en{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7C6CE6, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              superpoderes de estudio
            </span>
          </h1>

          {/* Descripción */}
          <p style={{
            fontSize: '1.15rem',
            color: '#7C75A6',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            StudySnap transforma tus fotografías de apuntes en flashcards,
            resúmenes y quizzes interactivos. Estudiar nunca fue tan fácil.
          </p>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('escanear')}
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
            >
              Comenzar gratis ✦
            </button>
            <button
              onClick={() => onNavigate('estudiar')}
              className="btn-secondary"
              style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
            >
              Ver demo
            </button>
          </div>
        </div>

        {/* ===== FLUJO DEL PROCESO ===== */}
        <div style={{ marginBottom: '5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', color: '#2C2855', marginBottom: '0.75rem', fontFamily: 'Nunito, sans-serif' }}>
            ¿Cómo funciona?
          </h2>
          <p style={{ textAlign: 'center', color: '#7C75A6', marginBottom: '2.5rem' }}>
            Tres pasos simples para transformar tu forma de estudiar
          </p>

          {/* Tarjetas de pasos con flechas conectoras */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            position: 'relative',
          }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {/* Tarjeta del paso */}
                <div
                  className="card"
                  style={{ padding: '2rem', textAlign: 'center', height: '100%' }}
                >
                  {/* Número del paso */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: step.accent,
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    margin: '0 auto 1rem',
                  }}>
                    {i + 1}
                  </div>

                  {/* Ícono grande */}
                  <div style={{
                    fontSize: '3rem',
                    background: step.color,
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}>
                    {step.emoji}
                  </div>

                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '1.1rem', color: '#2C2855', marginBottom: '0.5rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#7C75A6', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>

                {/* Flecha entre pasos (solo entre tarjetas, no después de la última) */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    right: '-1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    fontSize: '1.5rem',
                    color: '#DDD6FE',
                    display: 'none', // se muestra solo en desktop vía media query
                  }}
                  className="step-arrow-desktop"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== CARACTERÍSTICAS ===== */}
        <div>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', color: '#2C2855', marginBottom: '0.75rem', fontFamily: 'Nunito, sans-serif' }}>
            Todo lo que necesitas para estudiar mejor
          </h2>
          <p style={{ textAlign: 'center', color: '#7C75A6', marginBottom: '2.5rem' }}>
            Herramientas diseñadas pensando en los estudiantes de hoy
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="card"
                style={{ padding: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
              >
                <div style={{
                  fontSize: '1.75rem',
                  background: '#EDE9FF',
                  width: '52px',
                  height: '52px',
                  borderRadius: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#2C2855', marginBottom: '0.3rem' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#7C75A6', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
