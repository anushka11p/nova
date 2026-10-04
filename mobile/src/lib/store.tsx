import { Directory, File, Paths } from 'expo-file-system';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { RiskKey } from './clinical';

/** One saved screening. Field names follow the web API's records where they overlap. */
export interface Screening {
  id: string;
  patientId: string;
  name: string;
  ageDays: number | null;
  gender: 'Female' | 'Male' | null;
  notes: string;
  createdAt: string;
  probability: number;
  threshold: number;
  risk: RiskKey;
  modelUsed: string;
  ms: number;
  photoUri: string;
}

// Everything lives in the app's private documents folder: nothing is uploaded.
const dir = new Directory(Paths.document, 'screenings');
const index = new File(dir, 'records.json');
const settingsFile = new File(dir, 'settings.json');

function ensureDir() {
  if (!dir.exists) dir.create({ intermediates: true });
}

async function readAll(): Promise<Screening[]> {
  ensureDir();
  if (!index.exists) return [];
  try {
    const data = JSON.parse(await index.text());
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(list: Screening[]) {
  ensureDir();
  if (!index.exists) index.create();
  index.write(JSON.stringify(list));
}

/** Copy the screened photo into private storage so the record keeps it after the camera roll changes. */
export function keepPhoto(sourceUri: string, id: string): string {
  ensureDir();
  const dest = new File(dir, `${id}.jpg`);
  if (dest.exists) dest.delete();
  new File(sourceUri).copy(dest);
  return dest.uri;
}

function readWelcomeSeen(): boolean {
  try {
    return settingsFile.exists && JSON.parse(settingsFile.textSync()).welcomeSeen === true;
  } catch {
    return false;
  }
}

interface Store {
  ready: boolean;
  welcomeSeen: boolean;
  markWelcomeSeen: () => void;
  screenings: Screening[];
  add: (s: Screening) => void;
  remove: (id: string) => void;
  get: (id: string) => Screening | undefined;
}

const StoreContext = createContext<Store | null>(null);

export function ScreeningsProvider({ children }: { children: ReactNode }) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [ready, setReady] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(true);

  useEffect(() => {
    readAll().then((list) => {
      setScreenings(list);
      setWelcomeSeen(readWelcomeSeen());
      setReady(true);
    });
  }, []);

  const add = useCallback((s: Screening) => {
    setScreenings((prev) => {
      const next = [s, ...prev];
      writeAll(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setScreenings((prev) => {
      const gone = prev.find((s) => s.id === id);
      if (gone) {
        const photo = new File(gone.photoUri);
        if (photo.exists) photo.delete();
      }
      const next = prev.filter((s) => s.id !== id);
      writeAll(next);
      return next;
    });
  }, []);

  const markWelcomeSeen = useCallback(() => {
    ensureDir();
    if (!settingsFile.exists) settingsFile.create();
    settingsFile.write(JSON.stringify({ welcomeSeen: true }));
    setWelcomeSeen(true);
  }, []);

  const value = useMemo<Store>(
    () => ({ ready, welcomeSeen, markWelcomeSeen, screenings, add, remove, get: (id) => screenings.find((s) => s.id === id) }),
    [ready, welcomeSeen, markWelcomeSeen, screenings, add, remove],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useScreenings(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useScreenings must be used inside ScreeningsProvider');
  return s;
}

export function newPatientId() {
  return `NEO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function localDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
