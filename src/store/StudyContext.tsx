import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScannedNote, StudyStats, StudyStore } from './types';

const NOTES_KEY = 'studysnap:notes:v1';
const STATS_KEY = 'studysnap:stats:v1';

const DEFAULT_STATS: StudyStats = {
  flashcardsStudied: 0,
  quizzesCompleted: 0,
  quizScores: [],
  streakDays: 0,
  lastStudyDate: null,
};

function loadNotes(): ScannedNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const StudyContext = createContext<StudyStore | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<ScannedNote[]>(() => loadNotes());
  const [stats, setStats] = useState<StudyStats>(() => loadStats());

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // storage lleno o bloqueado: no rompemos la app
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // ignorar
    }
  }, [stats]);

  const addNote = useCallback((input: Omit<ScannedNote, 'id' | 'createdAt'>) => {
    const note: ScannedNote = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev].slice(0, 50)); // tope de 50 notas
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<ScannedNote>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const clearNotes = useCallback(() => setNotes([]), []);

  const recordFlashcardsStudied = useCallback((count: number) => {
    if (count <= 0) return;
    setStats((prev) => {
      const today = todayKey();
      const isNewDay = prev.lastStudyDate !== today;
      // Racha: si es nuevo día y ayer también estudió, +1. Simplificado: +1 por día nuevo.
      let streakDays = prev.streakDays;
      if (isNewDay) {
        if (!prev.lastStudyDate) streakDays = 1;
        else {
          const last = new Date(prev.lastStudyDate);
          const diff = Math.round(
            (new Date(today).getTime() - last.getTime()) / 86400000,
          );
          streakDays = diff === 1 ? prev.streakDays + 1 : 1;
        }
      }
      return {
        ...prev,
        flashcardsStudied: prev.flashcardsStudied + count,
        streakDays,
        lastStudyDate: today,
      };
    });
  }, []);

  const recordQuizAttempt = useCallback((score: number, total: number) => {
    setStats((prev) => {
      const today = todayKey();
      const isNewDay = prev.lastStudyDate !== today;
      let streakDays = prev.streakDays;
      if (isNewDay) {
        if (!prev.lastStudyDate) streakDays = 1;
        else {
          const last = new Date(prev.lastStudyDate);
          const diff = Math.round(
            (new Date(today).getTime() - last.getTime()) / 86400000,
          );
          streakDays = diff === 1 ? prev.streakDays + 1 : 1;
        }
      }
      return {
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        quizScores: [
          ...prev.quizScores,
          { id: makeId(), score, total, date: new Date().toISOString() },
        ].slice(-50),
        streakDays,
        lastStudyDate: today,
      };
    });
  }, []);

  const value = useMemo<StudyStore>(
    () => ({
      notes,
      stats,
      addNote,
      updateNote,
      clearNotes,
      recordFlashcardsStudied,
      recordQuizAttempt,
    }),
    [notes, stats, addNote, updateNote, clearNotes, recordFlashcardsStudied, recordQuizAttempt],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyStore {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy debe usarse dentro de <StudyProvider>');
  return ctx;
}
