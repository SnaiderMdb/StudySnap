// Tipos centrales de StudySnap — una sola fuente de verdad.

export interface SummaryItem {
  title: string;
  content: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ScannedNote {
  id: string;
  fileName: string;
  subject: string;
  summary: SummaryItem[];
  keywords: string[];
  rawText?: string; // texto OCR extraído
  method?: 'pdf-text' | 'ocr' | 'demo';
  aiEnhanced?: boolean; // true si la IA de Groq mejoró el contenido
  flashcards?: Flashcard[]; // generadas por IA (o local)
  quiz?: QuizQuestion[]; // generadas por IA (o local)
  createdAt: string; // ISO date
}

export interface QuizAttempt {
  id: string;
  score: number;
  total: number;
  date: string; // ISO date
}

export interface StudyStats {
  flashcardsStudied: number; // total de tarjetas vistas (únicas por sesión)
  quizzesCompleted: number;
  quizScores: QuizAttempt[];
  streakDays: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export interface StudyStore {
  notes: ScannedNote[];
  stats: StudyStats;
  addNote: (note: Omit<ScannedNote, 'id' | 'createdAt'>) => ScannedNote;
  updateNote: (id: string, patch: Partial<ScannedNote>) => void;
  clearNotes: () => void;
  recordFlashcardsStudied: (count: number) => void;
  recordQuizAttempt: (score: number, total: number) => void;
}
