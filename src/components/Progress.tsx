// ============================================================
// Progress.tsx — Sección "Mi Progreso"
// Muestra el avance del estudiante por materia y estadísticas
// ============================================================
import { useEffect, useState } from 'react';
import { useStudy } from '../store/StudyContext';

// Progreso por materia: aún es ejemplo hasta que haya tracking por materia.
// Se mantiene para el diseño, pero marcado como demo.
const SUBJECTS_DEMO = [
  { name: 'Biología', emoji: '🌱', progress: 78, cards: 24, quizzes: 6, color: '#d1fae5', accent: '#059669' },
  { name: 'Matemáticas', emoji: '📐', progress: 55, cards: 18, quizzes: 4, color: '#dbeafe', accent: '#2563EB' },
  { name: 'Historia', emoji: '📜', progress: 90, cards: 32, quizzes: 8, color: '#fce7f3', accent: '#DB2777' },
  { name: 'Física', emoji: '⚡', progress: 42, cards: 14, quizzes: 3, color: '#fef3c7', accent: '#D97706' },
];

// Componente de barra de progreso animada
function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  const [width, setWidth] = useState(0);

  // Anima la barra al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 150);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />
    </div>
  );
}

export default function Progress() {
  const { notes, stats } = useStudy();

  const avg = stats.quizScores.length
    ? Math.round(
        (stats.quizScores.reduce((a, q) => a + q.score / q.total, 0) /
          stats.quizScores.length) *
          100,
      )
    : 0;

  const STATS = [
    { label: 'Tarjetas estudiadas', value: String(stats.flashcardsStudied), icon: '🃏', color: '#EDE9FF', accent: '#7C6CE6' },
    { label: 'Quizzes completados', value: String(stats.quizzesCompleted), icon: '🎯', color: '#d1fae5', accent: '#059669' },
    { label: 'Racha de días', value: String(stats.streakDays), icon: '🔥', color: '#fef3c7', accent: '#D97706' },
    { label: 'Promedio general', value: `${avg}%`, icon: '📊', color: '#dbeafe', accent: '#2563EB' },
  ];

  const hasActivity = stats.flashcardsStudied > 0 || stats.quizzesCompleted > 0 || notes.length > 0;

  return (
    <section id="progreso" className="section" style={{ paddingTop: '7rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-block',
            background: '#EDE9FF',
            color: '#7C6CE6',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            marginBottom: '1rem',
          }}>
            📊 Mi Progreso
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontFamily: 'Nunito, sans-serif', color: '#2C2855', marginBottom: '0.75rem' }}>
            Tu avance de estudio
          </h2>
          <p style={{ color: '#7C75A6' }}>
            Monitorea cuánto has aprendido en cada materia
          </p>
        </div>

        {/* ===== ESTADÍSTICAS GENERALES ===== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '1.5rem', textAlign: 'center' }}
            >
              {/* Ícono */}
              <div style={{
                fontSize: '1.75rem',
                background: stat.color,
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
              }}>
                {stat.icon}
              </div>
              {/* Valor principal */}
              <div style={{
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 900,
                fontSize: '2rem',
                color: stat.accent,
                marginBottom: '0.25rem',
              }}>
                {stat.value}
              </div>
              {/* Etiqueta */}
              <p style={{ color: '#7C75A6', fontSize: '0.8rem', lineHeight: 1.4 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ===== ACTIVIDAD REAL ===== */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '0.75rem' }}>
            📝 Actividad real en este navegador
          </h3>
          {!hasActivity ? (
            <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
              Aún no hay actividad. Sube un apunte en Escanear, estudia flashcards o completa un quiz y volverá aquí automáticamente.
            </p>
          ) : (
            <div style={{ color: '#7C75A6', fontSize: '0.9rem', lineHeight: 1.7 }}>
              <p>📄 Apuntes guardados: <strong style={{ color: '#2C2855' }}>{notes.length}</strong></p>
              <p>🃏 Tarjetas vistas: <strong style={{ color: '#2C2855' }}>{stats.flashcardsStudied}</strong></p>
              <p>🎯 Quizzes: <strong style={{ color: '#2C2855' }}>{stats.quizzesCompleted}</strong> · Promedio <strong style={{ color: '#2C2855' }}>{avg}%</strong></p>
              {stats.quizScores.length > 0 && (
                <p style={{ marginTop: '0.5rem' }}>
                  Últimos intentos: {stats.quizScores.slice(-5).reverse().map(q => `${q.score}/${q.total}`).join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== PROGRESO POR MATERIA (demo) ===== */}
        <h3 style={{
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 800,
          fontSize: '1.2rem',
          color: '#2C2855',
          marginBottom: '0.25rem',
        }}>
          Progreso por materia
        </h3>
        <p style={{ color: '#7C75A6', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Datos de ejemplo — se reemplazarán por tracking real por materia.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SUBJECTS_DEMO.map((subject, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>

                {/* Ícono de la materia */}
                <div style={{
                  fontSize: '1.5rem',
                  background: subject.color,
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {subject.emoji}
                </div>

                {/* Nombre y detalles */}
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '0.2rem' }}>
                    {subject.name}
                  </h4>
                  <p style={{ color: '#7C75A6', fontSize: '0.8rem' }}>
                    {subject.cards} tarjetas · {subject.quizzes} quizzes
                  </p>
                </div>

                {/* Porcentaje */}
                <div style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  color: subject.accent,
                  flexShrink: 0,
                }}>
                  {subject.progress}%
                </div>
              </div>

              {/* Barra de progreso animada */}
              <AnimatedBar percent={subject.progress} color={subject.accent} />
            </div>
          ))}
        </div>

        {/* ===== MENSAJE MOTIVACIONAL ===== */}
        <div style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, #EDE9FF, #BAE6FD22)',
          border: '1px solid #DDD6FE',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌟</div>
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '0.5rem' }}>
            ¡Sigue así, lo estás haciendo muy bien!
          </h3>
          <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
            {stats.streakDays > 0
              ? `Llevas ${stats.streakDays} día${stats.streakDays !== 1 ? 's' : ''} seguidos estudiando. ¡Sigue así! 📚`
              : 'Estudia hoy para empezar tu racha 🔥'}
          </p>
        </div>

      </div>
    </section>
  );
}
