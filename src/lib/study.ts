// Análisis local del texto OCR — sin IA, sin costo.
// Genera: materia estimada, resumen por secciones y palabras clave.
// Cuando conectemos la API gratuita (Groq/Gemini), esta función será
// reemplazada por la llamada al LLM; la firma ya está lista para eso.

import type { SummaryItem } from '../store/types';

export interface Analysis {
  subject: string;
  summary: SummaryItem[];
  keywords: string[];
}

// Stopwords ES + EN mínimas para no contar "el/la/de/the/and".
const STOP = new Set(
  'el,la,los,las,un,una,unos,de,del,en,y,o,u,que,con,por,para,como,se,su,sus,al,es,son,fue,fueron,esta,este,esto,esta,estos,hay,tiene,tienen,entre,sobre,desde,hasta,más,menos,muy,también,pero,sino,sus,the,and,of,to,in,is,are,was,were,be,been,with,for,from,that,this,these,those,as,an,a,or,by,on,at,it,its,has,have,had,not,but,are'.split(','),
);

const SUBJECT_HINTS: { subject: string; words: string[] }[] = [
  { subject: 'Biología', words: ['célula', 'celula', 'adn', 'mitocondria', 'fotosíntesis', 'fotosintesis', 'núcleo', 'nucleo', 'proteína', 'proteina', 'especie', 'órgano', 'organo', 'tejido', 'bacteria', 'virus'] },
  { subject: 'Matemáticas', words: ['ecuación', 'ecuacion', 'triángulo', 'triangulo', 'función', 'funcion', 'derivada', 'integral', 'matriz', 'probabilidad', 'teorema', 'ángulo', 'angulo', 'fórmula', 'formula'] },
  { subject: 'Física', words: ['fuerza', 'velocidad', 'aceleración', 'aceleracion', 'energía', 'energia', 'newton', 'voltaje', 'corriente', 'onda', 'gravedad', 'masa', 'fricción', 'friccion'] },
  { subject: 'Química', words: ['átomo', 'atomo', 'molécula', 'molecula', 'reacción', 'reaccion', 'ácido', 'acido', 'elemento', 'compuesto', 'enlace', 'ph', 'oxidación', 'oxidacion'] },
  { subject: 'Historia', words: ['revolución', 'revolucion', 'guerra', 'siglo', 'imperio', 'república', 'republica', 'monarquía', 'monarquia', 'independencia', 'constitución', 'constitucion', 'presidente'] },
  { subject: 'Geografía', words: ['continente', 'océano', 'oceano', 'clima', 'relieve', 'población', 'poblacion', 'capital', 'frontera', 'latitud', 'longitud'] },
  { subject: 'Literatura', words: ['novela', 'poema', 'verso', 'narrador', 'protagonista', 'metáfora', 'metafora', 'cuento', 'autor', 'obra'] },
];

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?;:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 400);
}

function wordFreq(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

function scoreSentence(s: string, freq: Map<string, number>): number {
  const words = s.toLowerCase().split(/\s+/);
  let score = 0;
  for (const w of words) score += freq.get(w) ?? 0;
  // Penaliza oraciones larguísimas, premia longitud media
  return score / Math.sqrt(words.length);
}

export function analyzeText(rawText: string, fileName: string): Analysis {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // 1. Materia: la que más palabras pista tenga
  let subject = 'Apuntes generales';
  let best = 0;
  for (const h of SUBJECT_HINTS) {
    const hits = h.words.filter((w) => lower.includes(w)).length;
    if (hits > best) {
      best = hits;
      subject = h.subject;
    }
  }
  const cleanName = fileName.replace(/\.[a-z0-9]+$/i, '').slice(0, 40);
  const subjectLabel = best > 0 ? `${subject} — ${cleanName}` : cleanName || subject;

  // 2. Keywords: top 7 por frecuencia
  const freq = wordFreq(text);
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // 3. Resumen: rankea oraciones y toma hasta 5 diversas
  const ranked = sentences(text)
    .map((s) => ({ s, score: scoreSentence(s, freq) }))
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const r of ranked) {
    if (picked.length >= 8) break;
    // Diversidad: evita oraciones casi idénticas
    const tooSimilar = picked.some((p) => {
      const a = new Set(p.toLowerCase().split(/\s+/));
      const b = r.s.toLowerCase().split(/\s+/);
      const overlap = b.filter((w) => a.has(w)).length / Math.max(b.length, 1);
      return overlap > 0.6;
    });
    if (!tooSimilar) picked.push(r.s);
  }

  const summary: SummaryItem[] = picked.map((s, i) => {
    const words = s.split(/\s+/).slice(0, 6).join(' ');
    return {
      title: keywords[i] ?? `Punto ${i + 1}`,
      content: s.length > 180 ? `${words}… ${s.slice(words.length, 180)}` : s,
    };
  });

  return {
    subject: subjectLabel,
    summary: summary.length
      ? summary
      : [{ title: 'Texto extraído', content: text.slice(0, 300) }],
    keywords: keywords.length ? keywords : ['Apuntes'],
  };
}
