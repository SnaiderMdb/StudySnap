// ============================================================
// Study.tsx — Sección "Estudiar"
// Contiene flashcards interactivas y un quiz de opción múltiple
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useStudy } from '../store/StudyContext';

// ====== DATOS DE EJEMPLO (si aún no escaneas nada) ======
const FALLBACK_FLASHCARDS = [
  {
    front: '¿Qué es la fotosíntesis?',
    back: 'Proceso por el cual las plantas convierten la luz solar, agua y CO₂ en glucosa y oxígeno.',
    subject: 'Biología',
    color: '#d1fae5',
    accent: '#059669',
  },
  {
    front: '¿Cuál es la fórmula del área de un triángulo?',
    back: 'A = (base × altura) / 2\n\nEjemplo: base=6, altura=4 → A = 12',
    subject: 'Matemáticas',
    color: '#dbeafe',
    accent: '#2563EB',
  },
  {
    front: '¿Qué es la Segunda Ley de Newton?',
    back: 'F = m × a\n\nFuerza = masa × aceleración.',
    subject: 'Física',
    color: '#fef3c7',
    accent: '#D97706',
  },
];

const FALLBACK_QUIZ = [
  {
    question: '¿Qué organelo produce energía en la célula?',
    options: ['Núcleo', 'Mitocondria', 'Ribosoma', 'Lisosoma'],
    correctIndex: 1,
  },
  {
    question: '¿Qué gas producen las plantas durante la fotosíntesis?',
    options: ['CO₂', 'Nitrógeno', 'Oxígeno', 'Hidrógeno'],
    correctIndex: 2,
  },
];

const CARD_COLORS = [
  { color: '#ede9fe', accent: '#7C6CE6' },
  { color: '#d1fae5', accent: '#059669' },
  { color: '#dbeafe', accent: '#2563EB' },
  { color: '#fef3c7', accent: '#D97706' },
  { color: '#fce7f3', accent: '#DB2777' },
];

export interface UiCard {
  front: string;
  back: string;
  subject: string;
  color: string;
  accent: string;
}

// ====== COMPONENTE DE FLASHCARD ======
function Flashcard({ card, index, total }: { card: UiCard; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Indicador de posición */}
      <p style={{ color: '#7C75A6', fontSize: '0.875rem', marginBottom: '0.75rem', fontFamily: 'Nunito, sans-serif' }}>
        Tarjeta {index + 1} de {total} • <span style={{ color: card.accent, fontWeight: 700 }}>{card.subject}</span>
      </p>

      {/* Escena de la tarjeta (3D flip) */}
      <div
        className="flashcard-scene"
        style={{ width: '100%', height: '260px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          {/* Frente de la tarjeta (pregunta) */}
          <div
            className="flashcard-front"
            style={{ background: card.color, border: `2px solid ${card.accent}22` }}
          >
            <div style={{
              fontSize: '2rem',
              background: 'white',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: `0 4px 12px ${card.accent}22`,
            }}>
              ❓
            </div>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#2C2855' }}>
              {card.front}
            </h3>
            <p style={{ color: '#7C75A6', fontSize: '0.8rem', marginTop: '1rem' }}>
              Toca la tarjeta para ver la respuesta
            </p>
          </div>

          {/* Reverso de la tarjeta (respuesta) */}
          <div
            className="flashcard-back"
            style={{ background: 'white', border: `2px solid ${card.accent}44` }}
          >
            <div style={{
              fontSize: '2rem',
              background: card.color,
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              💡
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#2C2855', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {card.back}
            </p>
          </div>
        </div>
      </div>

      <p style={{ color: '#DDD6FE', fontSize: '0.8rem', marginTop: '0.75rem' }}>
        {flipped ? '✓ Respuesta mostrada' : 'Haz clic para voltear'}
      </p>
    </div>
  );
}

// ====== COMPONENTE DEL QUIZ ======
function Quiz({ questions, onFinish, resetKey }: { questions: { question: string; options: string[]; correctIndex: number }[]; onFinish: (score: number, total: number) => void; resetKey: string }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [score, setScore]         = useState(0);
  const [finished, setFinished]   = useState(false);
  const reportedRef = useRef(false);

  // Reinicia al cambiar de apunte
  useEffect(() => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    reportedRef.current = false;
  }, [resetKey]);

  const question = questions[currentQ];
  if (!question) return <p style={{ color: '#7C75A6' }}>No hay preguntas todavía. Escanea un apunte primero.</p>;

  // Reporta el intento una sola vez al terminar
  useEffect(() => {
    if (finished && !reportedRef.current) {
      reportedRef.current = true;
      onFinish(score, questions.length);
    }
  }, [finished, score, onFinish, questions.length]);

  // Maneja la selección de una respuesta
  function handleSelect(index: number) {
    if (selected !== null) return; // No permitir cambiar respuesta
    setSelected(index);
    if (index === question.correctIndex) setScore(s => s + 1);
  }

  // Avanza a la siguiente pregunta o termina
  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  // Reinicia el quiz desde cero
  function handleRestart() {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    reportedRef.current = false;
  }

  // Pantalla de resultados
  if (finished) {
    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    const emoji = percent >= 75 ? '🎉' : percent >= 50 ? '👍' : '📚';
    const msg   = percent >= 75 ? '¡Excelente trabajo!' : percent >= 50 ? '¡Buen esfuerzo!' : '¡Sigue practicando!';

    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{emoji}</div>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#2C2855', marginBottom: '0.5rem' }}>
          {msg}
        </h3>
        <p style={{ color: '#7C75A6', marginBottom: '0.5rem' }}>Tu resultado:</p>
        <div style={{ fontSize: '3rem', fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: '#7C6CE6', marginBottom: '0.5rem' }}>
          {score}/{questions.length}
        </div>
        <p style={{ color: '#7C75A6', marginBottom: '2rem' }}>{percent}% correcto</p>

        {/* Barra de resultado */}
        <div className="progress-bar" style={{ maxWidth: '240px', margin: '0 auto 2rem' }}>
          <div className="progress-fill" style={{ width: `${percent}%` }}/>
        </div>

        <button onClick={handleRestart} className="btn-primary">
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progreso del quiz */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: '#7C75A6', fontSize: '0.875rem', fontFamily: 'Nunito, sans-serif' }}>
          Pregunta {currentQ + 1} de {questions.length}
        </span>
        <span style={{ color: '#7C6CE6', fontSize: '0.875rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          {score} correcta{score !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="progress-bar" style={{ marginBottom: '1.75rem' }}>
        <div className="progress-fill" style={{ width: `${((currentQ) / questions.length) * 100}%` }}/>
      </div>

      {/* Pregunta */}
      <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#2C2855', marginBottom: '1.25rem', lineHeight: 1.4 }}>
        {question.question}
      </h4>

      {/* Opciones de respuesta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {question.options.map((option, i) => {
          let className = 'quiz-option';
          if (selected !== null) {
            if (i === question.correctIndex) className += ' correct';
            else if (i === selected && i !== question.correctIndex) className += ' incorrect';
          }

          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
            >
              <span style={{ fontWeight: 600, marginRight: '0.5rem', color: '#7C75A6' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Botón siguiente (visible tras seleccionar) */}
      {selected !== null && (
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleNext} className="btn-primary">
            {currentQ < questions.length - 1 ? 'Siguiente →' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}

// ====== COMPONENTE PRINCIPAL DE LA SECCIÓN ======
export default function Study() {
  const { recordFlashcardsStudied, recordQuizAttempt, notes } = useStudy();
  const [tab, setTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const visitedRef = useRef<Set<string>>(new Set());

  const decks = notes.filter((n) => (n.flashcards?.length ?? 0) > 0 || (n.quiz?.length ?? 0) > 0);
  const selected = decks.find((d) => d.id === selectedNoteId) ?? decks[0] ?? null;

  const activeCards: UiCard[] = selected?.flashcards?.length
    ? selected.flashcards.map((f, i) => ({
        front: f.front,
        back: f.back,
        subject: selected.subject,
        color: CARD_COLORS[i % CARD_COLORS.length].color,
        accent: CARD_COLORS[i % CARD_COLORS.length].accent,
      }))
    : FALLBACK_FLASHCARDS;

  const activeQuiz = selected?.quiz?.length ? selected.quiz : FALLBACK_QUIZ;
  const resetKey = selected?.id ?? 'fallback';

  // Reinicia al cambiar de apunte
  useEffect(() => {
    setCardIndex(0);
    visitedRef.current = new Set([`${resetKey}:0`]);
    recordFlashcardsStudied(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function goToCard(i: number) {
    const clamped = Math.max(0, Math.min(activeCards.length - 1, i));
    const key = `${resetKey}:${clamped}`;
    if (!visitedRef.current.has(key)) {
      visitedRef.current.add(key);
      recordFlashcardsStudied(1);
    }
    setCardIndex(clamped);
  }

  return (
    <section id="estudiar" className="section" style={{ paddingTop: '7rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
            🧠 Estudiar
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontFamily: 'Nunito, sans-serif', color: '#2C2855', marginBottom: '0.75rem' }}>
            Tu zona de estudio
          </h2>
          <p style={{ color: '#7C75A6' }}>
            Elige entre flashcards para memorizar o un quiz para ponerte a prueba
          </p>
        </div>

        {/* Tabs: Flashcards / Quiz */}
        <div style={{
          display: 'flex',
          background: '#EDE9FF',
          borderRadius: '999px',
          padding: '0.25rem',
          marginBottom: '2rem',
          maxWidth: '320px',
          margin: '0 auto 2rem',
        }}>
          {(['flashcards', 'quiz'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: '999px',
                border: 'none',
                background: tab === t ? '#7C6CE6' : 'transparent',
                color: tab === t ? 'white' : '#7C75A6',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t === 'flashcards' ? '🃏 Flashcards' : '🎯 Quiz'}
            </button>
          ))}
        </div>

        {/* Selector de apunte (cuando hay decks reales) */}
        {decks.length > 0 && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <label style={{ fontSize: '0.8rem', color: '#7C75A6', display: 'block', marginBottom: '0.5rem' }}>
              Estudiando de: {selected?.aiEnhanced ? '✨ IA' : '📝 local'}
            </label>
            <select
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              style={{
                padding: '0.6rem 1rem', borderRadius: '999px', border: '2px solid #DDD6FE',
                background: 'white', color: '#2C2855', fontFamily: 'Nunito, sans-serif',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', maxWidth: '100%',
              }}
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.aiEnhanced ? '✨ ' : ''}{d.subject} ({d.flashcards?.length ?? 0} tarjetas)
                </option>
              ))}
            </select>
          </div>
        )}
        {decks.length === 0 && (
          <p style={{ color: '#7C75A6', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Mostrando ejemplo. Escanea un apunte para estudiar con tus flashcards generadas por IA.
          </p>
        )}

        {/* Contenido: Flashcards */}
        {tab === 'flashcards' && (
          <div className="card" style={{ padding: '2rem' }}>
            <Flashcard
              card={activeCards[Math.min(cardIndex, activeCards.length - 1)]}
              index={Math.min(cardIndex, activeCards.length - 1)}
              total={activeCards.length}
            />

            {/* Navegación entre tarjetas */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.75rem', alignItems: 'center' }}>
              <button
                onClick={() => goToCard(cardIndex - 1)}
                className="btn-secondary"
                disabled={cardIndex === 0}
                style={{ opacity: cardIndex === 0 ? 0.4 : 1, fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
              >
                ← Anterior
              </button>

              {/* Puntos indicadores */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {activeCards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToCard(i)}
                    aria-label={`Ir a tarjeta ${i + 1}`}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: i === cardIndex ? '#7C6CE6' : '#DDD6FE',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => goToCard(cardIndex + 1)}
                className="btn-secondary"
                disabled={cardIndex === activeCards.length - 1}
                style={{ opacity: cardIndex === activeCards.length - 1 ? 0.4 : 1, fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Contenido: Quiz */}
        {tab === 'quiz' && (
          <div className="card" style={{ padding: '2rem' }}>
            <Quiz questions={activeQuiz} resetKey={resetKey} onFinish={(score, total) => recordQuizAttempt(score, total)} />
          </div>
        )}

      </div>
    </section>
  );
}
