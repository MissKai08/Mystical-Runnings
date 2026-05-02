import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mystical_journal_entries";

export interface DrawingData {
  paths: string[];
  width: number;
  height: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  moonPhase: string;
  spiritualContext: string[];
  inputType: "text" | "drawing";
  textContent?: string;
  drawingData?: DrawingData;
  createdAt: number;
}

export async function loadEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const existing = await loadEntries();
  const idx = existing.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    existing[idx] = entry;
  } else {
    existing.push(entry);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export async function deleteEntry(id: string): Promise<void> {
  const existing = await loadEntries();
  const filtered = existing.filter((e) => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatEntryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
