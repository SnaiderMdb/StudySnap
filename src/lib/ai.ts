// IA real con Groq (gratis, sin tarjeta) — genera resumen + flashcards + quiz
// de UNA vez desde el texto OCR. Si no hay key, la app usa el análisis local.
// Key: console.groq.com → VITE_GROQ_API_KEY en .env (nunca subir .env a git).

import type { Analysis } from './study';
import type { Flashcard, QuizQuestion } from '../store/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Catálogo Groq verificado oct-2026: llama-3.3 fue retirado.
// Activos para chat: qwen/qwen3.8-27b (recomendado), openai/gpt-oss-20b/120b.
const GROQ_MODEL = 'qwen/qwen3.8-27b';

export function hasGroqKey(): boolean {
  return Boolean((import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim());
}

export interface AiDeck extends Analysis {
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

const DECK_PROMPT = (text: string) => `Eres un tutor escolar experto. Analiza estos apuntes y devuelve SOLO JSON válido (sin markdown, sin explicaciones) con esta forma exacta:
{
 "subject": "Materia — Tema corto",
 "summary": [{"title": "Concepto", "content": "Explicación clara en 1-2 líneas"}],
 "keywords": ["máximo 7 palabras clave"],
 "flashcards": [{"front": "Pregunta para memorizar", "back": "Respuesta concisa"}],
 "quiz": [{"question": "Pregunta opción múltiple", "options": ["A", "B", "C", "D"], "correctIndex": 0}]
}
Reglas: 6-8 puntos de resumen, 8 flashcards, 8 preguntas de quiz con 4 opciones cada una y correctIndex 0-3. En español.
Apuntes:\n${text.slice(0, 8000)}`;

function cleanStr(v: unknown, max: number, fb = ''): string {
  return typeof v === 'string' ? v.slice(0, max).trim() || fb : fb;
}

function parseDeck(raw: string, fallback: Analysis): AiDeck {
  const localDeck = buildLocalDeck(fallback);
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return localDeck;
    const obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;

    const summaryRaw = Array.isArray(obj.summary) ? obj.summary : fallback.summary;
    const summary = summaryRaw.slice(0, 10).map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return {
        title: cleanStr(o.title, 80, 'Concepto'),
        content: cleanStr(o.content, 400, ''),
      };
    }).filter((s) => s.content);

    const keywords = Array.isArray(obj.keywords)
      ? (obj.keywords as unknown[]).map((k) => String(k).slice(0, 30)).filter(Boolean).slice(0, 7)
      : fallback.keywords;

    const fcRaw = Array.isArray(obj.flashcards) ? obj.flashcards : [];
    const flashcards: Flashcard[] = fcRaw.slice(0, 10).map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return { front: cleanStr(o.front, 200), back: cleanStr(o.back, 500) };
    }).filter((f) => f.front && f.back);

    const qRaw = Array.isArray(obj.quiz) ? obj.quiz : [];
    const quiz: QuizQuestion[] = qRaw.slice(0, 10).map((q) => {
      const o = (q ?? {}) as Record<string, unknown>;
      const options = Array.isArray(o.options)
        ? (o.options as unknown[]).map((x) => String(x).slice(0, 120)).filter(Boolean).slice(0, 4)
        : [];
      let correctIndex = typeof o.correctIndex === 'number' ? Math.floor(o.correctIndex) : 0;
      if (options.length < 2) return null;
      correctIndex = Math.max(0, Math.min(options.length - 1, correctIndex));
      return { question: cleanStr(o.question, 250), options, correctIndex };
    }).filter((q): q is QuizQuestion => q !== null && q.question.length > 0);

    if (!summary.length) return localDeck;
    return {
      subject: cleanStr(obj.subject, 80, fallback.subject),
      summary,
      keywords: keywords.length ? keywords : fallback.keywords,
      flashcards: flashcards.length ? flashcards : localDeck.flashcards,
      quiz: quiz.length >= 2 ? quiz : localDeck.quiz,
    };
  } catch {
    return localDeck;
  }
}

/** Deck local de respaldo (sin IA): deriva flashcards/quiz del resumen heurístico. */
export function buildLocalDeck(analysis: Analysis): AiDeck {
  const flashcards: Flashcard[] = analysis.summary.slice(0, 8).map((s) => ({
    front: `¿Qué es ${s.title}?`,
    back: s.content,
  }));
  const quiz: QuizQuestion[] = analysis.summary.slice(0, 8).map((s, i, arr) => {
    const distractors = arr
      .filter((_, j) => j !== i)
      .map((x) => x.title)
      .concat(analysis.keywords.filter((k) => k !== s.title))
      .filter((v, idx, self) => v && self.indexOf(v) === idx)
      .slice(0, 3);
    while (distractors.length < 3) distractors.push(`Concepto ${distractors.length + 1}`);
    const options = [s.title, ...distractors].slice(0, 4);
    // Mezcla simple determinista para no siempre poner la correcta en A
    const shift = i % options.length;
    const rotated = [...options.slice(shift), ...options.slice(0, shift)];
    return {
      question: `¿Cuál de estos conceptos corresponde a: "${s.content.slice(0, 90)}…"?`,
      options: rotated,
      correctIndex: rotated.indexOf(s.title),
    };
  });
  return { ...analysis, flashcards, quiz };
}

/**
 * Genera el deck completo. Si hay key de Groq usa IA real (~5-10s),
 * si no, devuelve el deck local al instante. Nunca lanza.
 */
export async function generateDeck(text: string, fallback: Analysis): Promise<AiDeck & { aiEnhanced: boolean }> {
  const key = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim();
  if (!key) return { ...buildLocalDeck(fallback), aiEnhanced: false };
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: DECK_PROMPT(text) }],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });
    if (!res.ok) {
      const msg = res.status === 401
        ? 'Key de Groq inválida (401). Revisa tu .env.'
        : res.status === 429
          ? 'Límite gratis de Groq alcanzado (429). Espera un minuto.'
          : `Groq respondió ${res.status}. Uso análisis local.`;
      console.warn('[AI]', msg);
      return { ...buildLocalDeck(fallback), aiEnhanced: false };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? '';
    const deck = parseDeck(content, fallback);
    return { ...deck, aiEnhanced: true };
  } catch (e) {
    console.warn('[AI] sin conexión a Groq, uso local:', e);
    return { ...buildLocalDeck(fallback), aiEnhanced: false };
  }
}

/** Compat: mejora solo el resumen (usado en versiones previas). */
export async function enhanceAnalysis(text: string, fallback: Analysis): Promise<Analysis> {
  const deck = await generateDeck(text, fallback);
  return { subject: deck.subject, summary: deck.summary, keywords: deck.keywords };
}
