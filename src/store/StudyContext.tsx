import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScannedNote, StudyStats, StudyStore } from './types';
import { useAuth } from './AuthContext';

const LEGACY_NOTES_KEY = 'studysnap:notes:v1';
const LEGACY_STATS_KEY = 'studysnap:stats:v1';
const NOTES_PREFIX = 'studysnap:notes:v2:';
const STATS_PREFIX = 'studysnap:stats:v2:';
const MIGRATED_PREFIX = 'studysnap:migrated:v2:';

const DEFAULT_STATS: StudyStats = {
  flashcardsStudied: 0,
  quizzesCompleted: 0,
  quizScores: [],
  streakDays: 0,
  lastStudyDate: null,
};

let legacyMigrated = false;

function notesKey(owner: string): string {
  return `${NOTES_PREFIX}${owner}`;
}

function statsKey(owner: string): string {
  return `${STATS_PREFIX}${owner}`;
}

function hasStatsActivity(stats: StudyStats): boolean {
  return stats.flashcardsStudied > 0 || stats.quizzesCompleted > 0 || stats.quizScores.length > 0;
}

function loadNotesRaw(owner: string): ScannedNote[] {
  try {
    const raw = localStorage.getItem(notesKey(owner));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStatsRaw(owner: string): StudyStats {
  try {
    const raw = localStorage.getItem(statsKey(owner));
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveNotes(owner: string, notes: ScannedNote[]): void {
  try {
    localStorage.setItem(notesKey(owner), JSON.stringify(notes));
  } catch {
    // storage lleno o bloqueado: no rompemos la app
  }
}

function saveStats(owner: string, stats: StudyStats): void {
  try {
    localStorage.setItem(statsKey(owner), JSON.stringify(stats));
  } catch {
    // ignorar
  }
}

/** Mueve los datos de la versión anterior (sin cuentas) al espacio de invitado. */
function migrateLegacyOnce(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;
  try {
    const oldNotes = localStorage.getItem(LEGACY_NOTES_KEY);
    if (oldNotes && !localStorage.getItem(notesKey('guest'))) {
      localStorage.setItem(notesKey('guest'), oldNotes);
    }
    const oldStats = localStorage.getItem(LEGACY_STATS_KEY);
    if (oldStats && !localStorage.getItem(statsKey('guest'))) {
      localStorage.setItem(statsKey('guest'), oldStats);
    }
  } catch {
    // ignorar
  }
}

/** Al entrar a una cuenta nueva, copia lo que el invitado ya había escaneado. */
function prepareOwner(owner: string): void {
  if (owner === 'guest') return;
  try {
    const flag = `${MIGRATED_PREFIX}${owner}`;
    if (localStorage.getItem(flag)) return;
    const guestNotes = loadNotesRaw('guest');
    const ownNotes = loadNotesRaw(owner);
    if (guestNotes.length && !ownNotes.length) saveNotes(owner, guestNotes);

    const guestStats = loadStatsRaw('guest');
    const ownStats = loadStatsRaw(owner);
    if (hasStatsActivity(guestStats) && !hasStatsActivity(ownStats)) saveStats(owner, guestStats);
    localStorage.setItem(flag, '1');
  } catch {
    // ignorar
  }
}

function loadNotesFor(owner: string): ScannedNote[] {
  prepareOwner(owner);
  return loadNotesRaw(owner);
}

function loadStatsFor(owner: string): StudyStats {
  prepareOwner(owner);
  return loadStatsRaw(owner);
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const StudyContext = createContext<StudyStore | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const owner = user?.id ?? 'guest';

  migrateLegacyOnce();

  const [currentOwner, setCurrentOwner] = useState(owner);
  const [notes, setNotes] = useState<ScannedNote[]>(() => loadNotesFor(owner));
  const [stats, setStats] = useState<StudyStats>(() => loadStatsFor(owner));

  useEffect(() => {
    if (owner === currentOwner) return;
    setNotes(loadNotesFor(owner));
    setStats(loadStatsFor(owner));
    setCurrentOwner(owner);
  }, [owner, currentOwner]);

  useEffect(() => {
    if (currentOwner !== owner) return;
    saveNotes(owner, notes);
  }, [notes, owner, currentOwner]);

  useEffect(() => {
    if (currentOwner !== owner) return;
    saveStats(owner, stats);
  }, [stats, owner, currentOwner]);

  const addNote = useCallback((input: Omit<ScannedNote, 'id' | 'createdAt'>) => {
    const note: ScannedNote = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev].slice(0, 50));
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
