import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mystical_journal_entries";
const FREEZE_KEY = "@mystical_streak_freezes";
const SHIELD_TOKENS_KEY = "@mystical_shield_tokens";
const SHIELD_GRANT_DATE_KEY = "@mystical_shield_grant_date";

export interface DrawingData {
  paths: string[];
  width: number;
  height: number;
}

export interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export const MOODS: Mood[] = [
  { id: "grounded",  emoji: "🪨", label: "Grounded",  color: "#92694A" },
  { id: "fire",      emoji: "🔥", label: "Fire",       color: "#F97316" },
  { id: "flow",      emoji: "💧", label: "Flow",       color: "#38BDF8" },
  { id: "growth",    emoji: "🌿", label: "Growth",     color: "#4ADE80" },
  { id: "electric",  emoji: "⚡", label: "Electric",   color: "#FCD34D" },
  { id: "mystical",  emoji: "🌙", label: "Mystical",   color: "#A78BFA" },
  { id: "clarity",   emoji: "✨", label: "Clarity",    color: "#BAE6FD" },
  { id: "shadow",    emoji: "🌑", label: "Shadow",     color: "#7C3AED" },
];

export interface EntryTag {
  id: string;
  label: string;
  color: string;
}

export const ENTRY_TAGS: EntryTag[] = [
  { id: "dream",      label: "Dream",            color: "#A78BFA" },
  { id: "ancestor",   label: "Ancestor Message",  color: "#D4A843" },
  { id: "orisha",     label: "Orisha Work",       color: "#F59E0B" },
  { id: "vision",     label: "Vision",            color: "#67E8F9" },
  { id: "ritual",     label: "Ritual",            color: "#F472B6" },
  { id: "divination", label: "Divination",        color: "#7C3AED" },
  { id: "shadow",     label: "Shadow Work",       color: "#94A3B8" },
  { id: "healing",    label: "Healing",           color: "#4ADE80" },
  { id: "manifest",   label: "Manifestation",     color: "#FCD34D" },
  { id: "moon-rite",  label: "Moon Rite",         color: "#C4B5FD" },
  { id: "prayer",     label: "Prayer",            color: "#FB923C" },
  { id: "gratitude",  label: "Gratitude",         color: "#34D399" },
];

export interface JournalEntry {
  id: string;
  date: string;
  moonPhase: string;
  spiritualContext: string[];
  inputType: "text" | "drawing";
  textContent?: string;
  drawingData?: DrawingData;
  mood?: string[];
  tags?: string[];
  isLunarLetter?: boolean;
  letterMonth?: string;
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

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function loadShieldTokens(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SHIELD_TOKENS_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : Math.max(0, n);
  } catch {
    return 0;
  }
}

export async function addShieldToken(): Promise<number> {
  const current = await loadShieldTokens();
  const next = Math.min(current + 1, 9);
  await AsyncStorage.setItem(SHIELD_TOKENS_KEY, String(next));
  return next;
}

export async function spendShieldToken(): Promise<boolean> {
  const current = await loadShieldTokens();
  if (current <= 0) return false;
  await AsyncStorage.setItem(SHIELD_TOKENS_KEY, String(current - 1));
  return true;
}

async function getLastShieldGrantDate(): Promise<string | null> {
  try { return await AsyncStorage.getItem(SHIELD_GRANT_DATE_KEY); }
  catch { return null; }
}

async function setLastShieldGrantDate(date: string): Promise<void> {
  await AsyncStorage.setItem(SHIELD_GRANT_DATE_KEY, date);
}

export async function checkAndGrantLunarShield(today: Date): Promise<{ granted: boolean; phase: "full" | "new" | null }> {
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const last = await getLastShieldGrantDate();
  if (last === key) return { granted: false, phase: null };

  const moon = getMoonPhaseDataSync(today);
  const isFullMoon = moon.isMajorPhase && moon.eventType === "full-moon";
  const isNewMoon = moon.isMajorPhase && moon.eventType === "new-moon";
  const isDarkMoon = isDarkMoonDay(today);

  if (isFullMoon || isNewMoon || isDarkMoon) {
    await addShieldToken();
    await setLastShieldGrantDate(key);
    return { granted: true, phase: isFullMoon ? "full" : "new" };
  }
  return { granted: false, phase: null };
}

function getMoonPhaseDataSync(date: Date): { isMajorPhase: boolean; eventType: string } {
  const LUNAR_CYCLE = 29.53058867;
  const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();
  const elapsed = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const isMajorPhase = phase <= 1.5 || (phase >= 14.25 && phase <= 15.75);
  const eventType = phase <= 1.5 ? "new-moon" : "full-moon";
  return { isMajorPhase, eventType };
}

function isDarkMoonDay(date: Date): boolean {
  const LUNAR_CYCLE = 29.53058867;
  const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();
  const elapsed = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  return phase >= 27.5 || phase <= 0.5;
}

export interface MoonWaterBlessing {
  id: string;
  date: string;
  chargingItems: string;
  intention: string;
  moonPhase: string;
  createdAt: number;
}

const MOON_WATER_KEY = "@mystical_moon_water_blessings";

export async function loadMoonWaterBlessings(): Promise<MoonWaterBlessing[]> {
  try {
    const raw = await AsyncStorage.getItem(MOON_WATER_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as MoonWaterBlessing[]).sort((a, b) => b.createdAt - a.createdAt);
  } catch { return []; }
}

export async function saveMoonWaterBlessing(entry: MoonWaterBlessing): Promise<void> {
  const existing = await loadMoonWaterBlessings();
  const idx = existing.findIndex((e) => e.id === entry.id);
  if (idx >= 0) existing[idx] = entry;
  else existing.push(entry);
  await AsyncStorage.setItem(MOON_WATER_KEY, JSON.stringify(existing));
}

export async function deleteMoonWaterBlessing(id: string): Promise<void> {
  const existing = await loadMoonWaterBlessings();
  await AsyncStorage.setItem(MOON_WATER_KEY, JSON.stringify(existing.filter((e) => e.id !== id)));
}

export function isInFullMoonWindow(date: Date): boolean {
  const moon = getMoonPhaseDataSync(date);
  if (moon.isMajorPhase && moon.eventType === "full-moon") return true;
  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const m = getMoonPhaseDataSync(d);
    if (m.isMajorPhase && m.eventType === "full-moon") return true;
  }
  return false;
}

export async function loadFreezes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FREEZE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function addFreeze(date: string): Promise<void> {
  const existing = await loadFreezes();
  if (!existing.includes(date)) {
    existing.push(date);
    await AsyncStorage.setItem(FREEZE_KEY, JSON.stringify(existing));
  }
}

export async function removeFreeze(date: string): Promise<void> {
  const existing = await loadFreezes();
  const filtered = existing.filter((d) => d !== date);
  await AsyncStorage.setItem(FREEZE_KEY, JSON.stringify(filtered));
}

export function calculateStreak(entries: JournalEntry[], freezes: string[] = []): number {
  const written = new Set([...entries.map((e) => e.date), ...freezes]);
  if (written.size === 0) return 0;
  const today = new Date();
  const cursor = new Date(today);
  if (!written.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (written.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(entries: JournalEntry[], freezes: string[] = []): number {
  const days = [...new Set([...entries.map((e) => e.date), ...freezes])].sort();
  if (days.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}
