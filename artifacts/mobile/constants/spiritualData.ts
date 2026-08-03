import AsyncStorage from "@react-native-async-storage/async-storage";

export type EventType =
  | "new-moon"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full-moon"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent"
  | "dark-moon"
  | "named-moon"
  | "retrograde"
  | "ifa-prayer"
  | "ifa-festival"
  | "sabbat"
  | "solar-eclipse"
  | "lunar-eclipse"
  | "ose-day"
  | "meteor-shower"
  | "planet-opposition"
  | "planet-elongation"
  | "planet-event"
  | "solstice"
  | "equinox";

export interface MoonPhaseData {
  phase: number;
  phaseFraction: number;
  name: string;
  illumination: number;
  isMajorPhase: boolean;
  eventType: EventType;
}

export interface RetrogradePeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface IfaFestival {
  name: string;
  date: Date;
  description: string;
}

export interface WheelEvent {
  name: string;
  date: Date;
  type: EventType;
  description: string;
  sign?: string;
  /** Seasonal tide this event falls within, e.g. "Imbolctide" */
  tide?: string;
  /** Tidal polarity — "Waxing" (building) or "Waning" (releasing) */
  polarity?: string;
  /** Elemental quality of the tide, e.g. "Earth Receptive" */
  element?: string;
  /** Magical intent for the tide, e.g. "To Resonate" */
  intent?: string;
  /** Celebration timing guidance from Heron Michelle / Patheos */
  timing?: string;
  /** True for near-perigee full moons that appear larger than average */
  isSupermoon?: boolean;
  /** True for a second full moon in a calendar month, or the third of four full moons in a season */
  isBlueMoon?: boolean;
}

export interface SpiritualEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  color: string;
  date: Date;
  endDate?: Date;
}

export const EVENT_COLORS: Record<EventType, string> = {
  "new-moon": "#6D28D9",
  "waxing-crescent": "#8B5CF6",
  "first-quarter": "#A78BFA",
  "waxing-gibbous": "#C4B5FD",
  "full-moon": "#A78BFA",
  "waning-gibbous": "#C4B5FD",
  "last-quarter": "#A78BFA",
  "waning-crescent": "#8B5CF6",
  "dark-moon": "#4C1D95",
  "named-moon": "#A78BFA",
  retrograde: "#F97316",
  "ifa-prayer": "#D4A843",
  "ifa-festival": "#22D3EE",
  sabbat: "#34D399",
  "solar-eclipse": "#F59E0B",
  "lunar-eclipse": "#EC4899",
  "ose-day": "#D4A843",
  "meteor-shower": "#C084FC",
  "planet-opposition": "#F59E0B",
  "planet-elongation": "#FBBF24",
  "planet-event": "#FBBF24",
  solstice: "#10B981",
  equinox: "#34D399",
};

const LUNAR_CYCLE_DAYS = 29.53058867;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const KNOWN_NEW_MOON_MS = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();

// Authoritative major-phase dates sourced from USNO Astronomical Applications.
// Key: "YYYY-M-D" (local calendar date, UTC). Value: major EventType.
// This lookup takes priority over the mathematical formula for 2024–2027.
const PHASE_LOOKUP: Record<string, "new-moon" | "first-quarter" | "full-moon" | "last-quarter"> = {
  // ── 2024 ──
  "2024-1-4":"last-quarter", "2024-1-11":"new-moon", "2024-1-18":"first-quarter", "2024-1-25":"full-moon",
  "2024-2-2":"last-quarter", "2024-2-9":"new-moon", "2024-2-16":"first-quarter", "2024-2-24":"full-moon",
  "2024-3-3":"last-quarter", "2024-3-10":"new-moon", "2024-3-17":"first-quarter", "2024-3-25":"full-moon",
  "2024-4-2":"last-quarter", "2024-4-8":"new-moon", "2024-4-15":"first-quarter", "2024-4-23":"full-moon",
  "2024-4-30":"last-quarter", "2024-5-7":"new-moon", "2024-5-15":"first-quarter", "2024-5-23":"full-moon",
  "2024-5-30":"last-quarter", "2024-6-6":"new-moon", "2024-6-14":"first-quarter", "2024-6-22":"full-moon",
  "2024-6-28":"last-quarter", "2024-7-5":"new-moon", "2024-7-13":"first-quarter", "2024-7-21":"full-moon",
  "2024-7-27":"last-quarter", "2024-8-4":"new-moon", "2024-8-12":"first-quarter", "2024-8-19":"full-moon",
  "2024-8-26":"last-quarter", "2024-9-3":"new-moon", "2024-9-11":"first-quarter", "2024-9-18":"full-moon",
  "2024-9-24":"last-quarter", "2024-10-2":"new-moon", "2024-10-10":"first-quarter", "2024-10-17":"full-moon",
  "2024-10-24":"last-quarter", "2024-11-1":"new-moon", "2024-11-9":"first-quarter", "2024-11-15":"full-moon",
  "2024-11-23":"last-quarter", "2024-12-1":"new-moon", "2024-12-8":"first-quarter", "2024-12-15":"full-moon",
  "2024-12-22":"last-quarter", "2024-12-30":"new-moon",
  // ── 2025 ──
  "2025-1-6":"first-quarter", "2025-1-13":"full-moon", "2025-1-21":"last-quarter", "2025-1-29":"new-moon",
  "2025-2-5":"first-quarter", "2025-2-12":"full-moon", "2025-2-20":"last-quarter", "2025-2-28":"new-moon",
  "2025-3-6":"first-quarter", "2025-3-14":"full-moon", "2025-3-22":"last-quarter", "2025-3-29":"new-moon",
  "2025-4-5":"first-quarter", "2025-4-13":"full-moon", "2025-4-20":"last-quarter", "2025-4-27":"new-moon",
  "2025-5-4":"first-quarter", "2025-5-12":"full-moon", "2025-5-20":"last-quarter", "2025-5-26":"new-moon",
  "2025-6-3":"first-quarter", "2025-6-11":"full-moon", "2025-6-18":"last-quarter", "2025-6-25":"new-moon",
  "2025-7-2":"first-quarter", "2025-7-10":"full-moon", "2025-7-18":"last-quarter", "2025-7-24":"new-moon",
  "2025-8-1":"first-quarter", "2025-8-9":"full-moon", "2025-8-16":"last-quarter", "2025-8-23":"new-moon",
  "2025-8-31":"first-quarter", "2025-9-7":"full-moon", "2025-9-14":"last-quarter", "2025-9-21":"new-moon",
  "2025-9-29":"first-quarter", "2025-10-7":"full-moon", "2025-10-13":"last-quarter", "2025-10-21":"new-moon",
  "2025-10-29":"first-quarter", "2025-11-5":"full-moon", "2025-11-12":"last-quarter", "2025-11-20":"new-moon",
  "2025-11-28":"first-quarter", "2025-12-4":"full-moon", "2025-12-12":"last-quarter", "2025-12-20":"new-moon",
  "2025-12-27":"first-quarter",
  // ── 2026 ──
  "2026-1-3":"full-moon", "2026-1-10":"last-quarter", "2026-1-18":"new-moon", "2026-1-26":"first-quarter",
  "2026-2-1":"full-moon", "2026-2-9":"last-quarter", "2026-2-17":"new-moon", "2026-2-24":"first-quarter",
  "2026-3-3":"full-moon", "2026-3-11":"last-quarter", "2026-3-19":"new-moon", "2026-3-25":"first-quarter",
  "2026-4-2":"full-moon", "2026-4-10":"last-quarter", "2026-4-17":"new-moon", "2026-4-24":"first-quarter",
  "2026-5-1":"full-moon", "2026-5-9":"last-quarter", "2026-5-16":"new-moon", "2026-5-23":"first-quarter",
  "2026-5-31":"full-moon", "2026-6-8":"last-quarter", "2026-6-15":"new-moon", "2026-6-21":"first-quarter",
  "2026-6-29":"full-moon", "2026-7-7":"last-quarter", "2026-7-14":"new-moon", "2026-7-21":"first-quarter",
  "2026-7-29":"full-moon", "2026-8-6":"last-quarter", "2026-8-12":"new-moon", "2026-8-20":"first-quarter",
  "2026-8-28":"full-moon", "2026-9-4":"last-quarter", "2026-9-12":"new-moon", "2026-9-19":"first-quarter",
  "2026-9-26":"full-moon", "2026-10-3":"last-quarter", "2026-10-11":"new-moon", "2026-10-18":"first-quarter",
  "2026-10-26":"full-moon", "2026-11-1":"last-quarter", "2026-11-9":"new-moon", "2026-11-17":"first-quarter",
  "2026-11-24":"full-moon", "2026-12-1":"last-quarter", "2026-12-9":"new-moon", "2026-12-17":"first-quarter",
  "2026-12-24":"full-moon", "2026-12-31":"last-quarter",
  // ── 2027 ──
  "2027-1-7":"new-moon", "2027-1-15":"first-quarter", "2027-1-22":"full-moon", "2027-1-29":"last-quarter",
  "2027-2-6":"new-moon", "2027-2-14":"first-quarter", "2027-2-20":"full-moon", "2027-2-28":"last-quarter",
  "2027-3-8":"new-moon", "2027-3-15":"first-quarter", "2027-3-22":"full-moon", "2027-3-30":"last-quarter",
  "2027-4-6":"new-moon", "2027-4-13":"first-quarter", "2027-4-20":"full-moon", "2027-4-28":"last-quarter",
  "2027-5-6":"new-moon", "2027-5-13":"first-quarter", "2027-5-20":"full-moon", "2027-5-28":"last-quarter",
  "2027-6-4":"new-moon", "2027-6-11":"first-quarter", "2027-6-19":"full-moon", "2027-6-27":"last-quarter",
  "2027-7-4":"new-moon", "2027-7-10":"first-quarter", "2027-7-18":"full-moon", "2027-7-26":"last-quarter",
  "2027-8-2":"new-moon", "2027-8-9":"first-quarter", "2027-8-17":"full-moon", "2027-8-25":"last-quarter",
  "2027-8-31":"new-moon", "2027-9-7":"first-quarter", "2027-9-15":"full-moon", "2027-9-23":"last-quarter",
  "2027-9-30":"new-moon", "2027-10-7":"first-quarter", "2027-10-15":"full-moon", "2027-10-22":"last-quarter",
  "2027-10-29":"new-moon", "2027-11-6":"first-quarter", "2027-11-14":"full-moon", "2027-11-21":"last-quarter",
  "2027-11-28":"new-moon", "2027-12-6":"first-quarter", "2027-12-13":"full-moon", "2027-12-20":"last-quarter",
  "2027-12-27":"new-moon",
};

function moonAge(date: Date): number {
  const noon = new Date(date);
  noon.setUTCHours(12, 0, 0, 0);
  const diff = (noon.getTime() - KNOWN_NEW_MOON_MS) / MS_PER_DAY;
  return ((diff % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
}

function distToQ(age: number, q: number): number {
  if (q === 0) return Math.min(age, LUNAR_CYCLE_DAYS - age);
  return Math.abs(age - q);
}

export function getMoonPhaseData(date: Date): MoonPhaseData {
  const Q1 = LUNAR_CYCLE_DAYS / 4;
  const Q2 = LUNAR_CYCLE_DAYS / 2;
  const Q3 = (3 * LUNAR_CYCLE_DAYS) / 4;

  const phase = moonAge(date);
  const phaseFraction = phase / LUNAR_CYCLE_DAYS;
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * phaseFraction)));

  // Check hardcoded USNO lookup table first (covers 2024–2027).
  const lookupKey = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  const hardcoded = PHASE_LOOKUP[lookupKey];
  if (hardcoded) {
    const nameMap: Record<string, string> = {
      "new-moon": "New Moon",
      "first-quarter": "First Quarter",
      "full-moon": "Full Moon",
      "last-quarter": "Last Quarter",
    };
    return { phase, phaseFraction, name: nameMap[hardcoded]!, illumination, isMajorPhase: true, eventType: hardcoded };
  }

  // For years inside the 2024–2027 range, the lookup table is the ONLY
  // source of truth for major phases. Dates not in the table are minor phases.
  const year = date.getFullYear();
  if (year >= 2024 && year <= 2027) {
    let eventType: EventType;
    let name: string;
    if (phase < Q1) {
      name = "Waxing Crescent"; eventType = "waxing-crescent";
    } else if (phase < Q2) {
      name = "Waxing Gibbous";  eventType = "waxing-gibbous";
    } else if (phase < Q3) {
      name = "Waning Gibbous";  eventType = "waning-gibbous";
    } else {
      name = "Waning Crescent"; eventType = "waning-crescent";
    }
    return { phase, phaseFraction, name, illumination, isMajorPhase: false, eventType };
  }

  // Primary fallback: USNO phases year-cache (async-populated via prefetchUsnoPhases / initUsnoCache).
  const cacheKey = `${year}-${date.getMonth() + 1}-${date.getDate()}`;
  if (USNO_YEAR_CACHE[year]) {
    const cachedPhase = USNO_YEAR_CACHE[year][cacheKey];
    if (cachedPhase) {
      const phaseNameMap: Record<string, string> = {
        "new-moon": "New Moon",
        "first-quarter": "First Quarter",
        "full-moon": "Full Moon",
        "last-quarter": "Last Quarter",
      };
      return { phase, phaseFraction, name: phaseNameMap[cachedPhase]!, illumination, isMajorPhase: true, eventType: cachedPhase };
    }
    // Year is in cache but this date is not a major phase — return minor phase
    let minorName: string;
    let minorType: EventType;
    if (phase < Q1) { minorName = "Waxing Crescent"; minorType = "waxing-crescent"; }
    else if (phase < Q2) { minorName = "Waxing Gibbous"; minorType = "waxing-gibbous"; }
    else if (phase < Q3) { minorName = "Waning Gibbous"; minorType = "waning-gibbous"; }
    else { minorName = "Waning Crescent"; minorType = "waning-crescent"; }
    return { phase, phaseFraction, name: minorName, illumination, isMajorPhase: false, eventType: minorType };
  }

  // Final fallback: mathematical closest-day formula (works offline, no cache required).
  const dPrev = new Date(date); dPrev.setDate(dPrev.getDate() - 1);
  const dNext = new Date(date); dNext.setDate(dNext.getDate() + 1);
  const prev = moonAge(dPrev);
  const next = moonAge(dNext);

  const closest = (q: number) =>
    distToQ(phase, q) < distToQ(prev, q) && distToQ(phase, q) <= distToQ(next, q);

  let name: string;
  let isMajorPhase = false;
  let eventType: EventType;

  if (closest(0)) {
    name = "New Moon";        isMajorPhase = true; eventType = "new-moon";
  } else if (closest(Q1)) {
    name = "First Quarter";   isMajorPhase = true; eventType = "first-quarter";
  } else if (closest(Q2)) {
    name = "Full Moon";       isMajorPhase = true; eventType = "full-moon";
  } else if (closest(Q3)) {
    name = "Last Quarter";    isMajorPhase = true; eventType = "last-quarter";
  } else if (phase < Q1) {
    name = "Waxing Crescent"; eventType = "waxing-crescent";
  } else if (phase < Q2) {
    name = "Waxing Gibbous";  eventType = "waxing-gibbous";
  } else if (phase < Q3) {
    name = "Waning Gibbous";  eventType = "waning-gibbous";
  } else {
    name = "Waning Crescent"; eventType = "waning-crescent";
  }

  return { phase, phaseFraction, name, illumination, isMajorPhase, eventType };
}

// ── USNO moon/phases/year cache ────────────────────────────────────────────────
// In-memory; survives for the lifetime of the JS runtime.
// Populated by initUsnoCache() (loads AsyncStorage → memory) and
// prefetchUsnoPhases() (fetches USNO API → AsyncStorage → memory).
const USNO_YEAR_CACHE: Record<number, Record<string, "new-moon" | "first-quarter" | "full-moon" | "last-quarter">> = {};

const USNO_PHASES_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const USNO_PHASE_KEY_MAP: Record<string, "new-moon" | "first-quarter" | "full-moon" | "last-quarter"> = {
  "New Moon": "new-moon",
  "First Quarter": "first-quarter",
  "Full Moon": "full-moon",
  "Last Quarter": "last-quarter",
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseUsnoPhaseDate(dateStr: string): string | null {
  // dateStr format: "YYYY MMM DD", e.g. "2028 Jan 12"
  const parts = dateStr.split(" ");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const monthIdx = MONTH_ABBR.indexOf(parts[1]);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || monthIdx < 0 || isNaN(day)) return null;
  return `${year}-${monthIdx + 1}-${day}`;
}

/** Fetch moon phases for a given year from USNO API and store in memory + AsyncStorage. */
export async function prefetchUsnoPhases(year: number): Promise<void> {
  // Skip years already covered by PHASE_LOOKUP
  if (year >= 2024 && year <= 2027) return;
  const storageKey = `@usno_phases_${year}`;
  try {
    // Check AsyncStorage cache first
    const cached = await AsyncStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { data: Record<string, "new-moon"|"first-quarter"|"full-moon"|"last-quarter">; savedAt: number };
      if (Date.now() - parsed.savedAt < USNO_PHASES_TTL_MS) {
        USNO_YEAR_CACHE[year] = parsed.data;
        return;
      }
    }

    const resp = await fetch(`https://aa.usno.navy.mil/api/moon/phases/year?year=${year}&nump=99`);
    if (!resp.ok) return;
    const json = await resp.json() as { phasedata?: { phase: string; date: string; time: string }[] };
    const phasedata = json?.phasedata ?? [];

    const dayMap: Record<string, "new-moon"|"first-quarter"|"full-moon"|"last-quarter"> = {};
    for (const entry of phasedata) {
      const eventType = USNO_PHASE_KEY_MAP[entry.phase];
      const key = parseUsnoPhaseDate(entry.date);
      if (eventType && key) dayMap[key] = eventType;
    }

    USNO_YEAR_CACHE[year] = dayMap;
    await AsyncStorage.setItem(storageKey, JSON.stringify({ data: dayMap, savedAt: Date.now() }));
  } catch {
    // Silently fail — math fallback will be used
  }
}

/** Call once on app start to warm the in-memory cache from any previously fetched data in AsyncStorage. */
export async function initUsnoCache(): Promise<void> {
  // Preload current and upcoming years (outside the PHASE_LOOKUP range)
  const currentYear = new Date().getFullYear();
  const yearsToLoad = [currentYear, currentYear + 1, currentYear + 2].filter(y => y > 2027);
  await Promise.allSettled(yearsToLoad.map(y => prefetchUsnoPhases(y)));
}

export const MERCURY_RETROGRADES: RetrogradePeriod[] = [
  { start: new Date(2024, 3, 1), end: new Date(2024, 3, 25), label: "Mercury Retrograde in Aries" },
  { start: new Date(2024, 7, 5), end: new Date(2024, 7, 28), label: "Mercury Retrograde in Virgo/Leo" },
  { start: new Date(2024, 10, 26), end: new Date(2024, 11, 15), label: "Mercury Retrograde in Sagittarius" },
  { start: new Date(2025, 2, 15), end: new Date(2025, 3, 7), label: "Mercury Retrograde in Aries/Pisces" },
  { start: new Date(2025, 6, 18), end: new Date(2025, 7, 11), label: "Mercury Retrograde in Leo" },
  { start: new Date(2025, 10, 9), end: new Date(2025, 10, 29), label: "Mercury Retrograde in Sagittarius" },
  { start: new Date(2026, 1, 26), end: new Date(2026, 2, 20), label: "Mercury Retrograde in Pisces" },
  { start: new Date(2026, 5, 29), end: new Date(2026, 6, 23), label: "Mercury Retrograde in Cancer" },
  { start: new Date(2026, 9, 24), end: new Date(2026, 10, 13), label: "Mercury Retrograde in Scorpio" },
  { start: new Date(2027, 1, 9), end: new Date(2027, 2, 3), label: "Mercury Retrograde in Pisces" },
  { start: new Date(2027, 5, 10), end: new Date(2027, 6, 4), label: "Mercury Retrograde in Cancer" },
  { start: new Date(2027, 9, 7), end: new Date(2027, 9, 28), label: "Mercury Retrograde in Scorpio" },
  { start: new Date(2028, 0, 24), end: new Date(2028, 1, 24), label: "Mercury Retrograde in Aquarius" },
  { start: new Date(2028, 4, 21), end: new Date(2028, 5, 24), label: "Mercury Retrograde in Gemini" },
  { start: new Date(2028, 8, 19), end: new Date(2028, 9, 11), label: "Mercury Retrograde in Libra" },
];

export const IFA_FESTIVALS: IfaFestival[] = [
  { name: "Ifa Festival", date: new Date(2025, 5, 7), description: "Annual celebration honoring Orunmila and the Ifa corpus" },
  { name: "Osun-Osogbo Festival", date: new Date(2025, 7, 8), description: "Sacred festival at the Osun Grove, UNESCO World Heritage site" },
  { name: "Olojo Festival", date: new Date(2025, 9, 3), description: "Festival honoring Ogun at Ile-Ife — the Ooni wears the sacred Aare crown" },
  { name: "Egungun Festival", date: new Date(2025, 5, 20), description: "Masquerade festival honoring and communing with ancestral spirits" },
  { name: "Ọdún Tuntun — Yorùbá New Year", date: new Date(2025, 5, 3), description: "The Yorùbá New Year marks a fresh beginning in the traditional calendar. A time to honor ancestors, refresh the spirit, and embrace new beginnings. Reference: Embracing Ọdún Tuntun (share.google/Pq3abysIwxpmcpBZe)" },
  { name: "Ifa Festival", date: new Date(2026, 5, 6), description: "Annual celebration honoring Orunmila and the Ifa corpus" },
  { name: "Osun-Osogbo Festival", date: new Date(2026, 7, 14), description: "Sacred festival at the Osun Grove" },
  { name: "Olojo Festival", date: new Date(2026, 9, 16), description: "Festival honoring Ogun at Ile-Ife" },
  { name: "Egungun Festival", date: new Date(2026, 5, 19), description: "Masquerade festival honoring ancestral spirits" },
  { name: "Ọdún Tuntun — Yorùbá New Year", date: new Date(2026, 5, 3), description: "The Yorùbá New Year marks a fresh beginning in the traditional calendar. A time to honor ancestors, refresh the spirit, and embrace new beginnings. Reference: Embracing Ọdún Tuntun (share.google/Pq3abysIwxpmcpBZe)" },
  { name: "Ọdún Tuntun — Yorùbá New Year", date: new Date(2027, 5, 3), description: "The Yorùbá New Year marks a fresh beginning in the traditional calendar. A time to honor ancestors, refresh the spirit, and embrace new beginnings. Reference: Embracing Ọdún Tuntun (share.google/Pq3abysIwxpmcpBZe)" },
];

// 2026 Wheel of the Year — Sabbats (source: Patheos / Heron Michelle)
// tide/polarity/element/intent fields follow the Tides of the Year framework by Heron Michelle
export const SABBATS: WheelEvent[] = [
  {
    name: "Yule — Winter Solstice",
    date: new Date(2025, 11, 21),
    type: "sabbat",
    description: "Sun enters Capricorn at 10:03 AM ET. The longest night of the year — light a candle and honor the return of the sun.",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
  },
  {
    name: "Imbolc — High Winter",
    date: new Date(2026, 1, 3),
    type: "sabbat",
    description: "Sun at 15° Aquarius. Festival of the returning light — honor Brigid, cleanse and set intentions for the year ahead.",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
  },
  {
    name: "Ostara — Spring Equinox",
    date: new Date(2026, 2, 20),
    type: "sabbat",
    description: "Sun enters Aries at 10:46 AM ET. Balance of light and dark — seeds planted now carry the force of the equinox.",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
  },
  {
    name: "Beltane — High Spring",
    date: new Date(2026, 4, 5),
    type: "sabbat",
    description: "Sun at 15° Taurus. Festival of fire and fertility — the peak of spring's creative power.",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
  },
  {
    name: "Litha — Summer Solstice",
    date: new Date(2026, 5, 21),
    type: "sabbat",
    description: "Sun enters Cancer at 4:24 AM ET. The longest day of the year — celebrate the sun at its fullest strength.",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
  },
  {
    name: "Lammas — High Summer",
    date: new Date(2026, 7, 7),
    type: "sabbat",
    description: "Sun at 15° Leo. First harvest festival — give thanks for abundance, begin the slow turn toward autumn.",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
  },
  {
    name: "Mabon — Autumn Equinox",
    date: new Date(2026, 8, 22),
    type: "sabbat",
    description: "Sun enters Libra at 8:05 PM ET. Second harvest — balance returns, honor gratitude and release.",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
  },
  {
    name: "Samhain — High Autumn",
    date: new Date(2026, 10, 7),
    type: "sabbat",
    description: "Sun at 15° Scorpio. The veil between worlds is thinnest — honor the dead, your ancestors, and the cycle of endings.",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
  },
  {
    name: "Yule — Winter Solstice",
    date: new Date(2026, 11, 21),
    type: "sabbat",
    description: "Sun enters Capricorn at 3:50 PM ET. The wheel completes — welcome the return of the light once more.",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
  },
  // ── 2027 Wheel of the Year (source: Patheos / Heron Michelle) ──────────────
  {
    name: "Imbolc — High Winter",
    date: new Date(2027, 1, 2),
    type: "sabbat",
    description: "Sun at 15° Aquarius. Festival of Brigid — kindle the first fire of the new season, bless seeds not yet planted.",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Begins dusk Feb 1, peaks Feb 2.",
  },
  {
    name: "Ostara — Spring Equinox",
    date: new Date(2027, 2, 20),
    type: "sabbat",
    description: "Sun enters Aries at 4:24 AM ET. Day and night balanced at the threshold of spring — plant, begin, align.",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Begins dusk Mar 19, peaks Mar 20.",
  },
  {
    name: "Beltane — High Spring",
    date: new Date(2027, 4, 5),
    type: "sabbat",
    description: "Sun at 15° Taurus. The fires of Beltane ignite — celebrate life, fertility, and sacred union.",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Begins dusk May 4, peaks May 5.",
  },
  {
    name: "Litha — Summer Solstice",
    date: new Date(2027, 5, 21),
    type: "sabbat",
    description: "Sun enters Cancer at 10:11 AM ET. The zenith of solar power — the longest day. Honor the sun before the tide turns.",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Begins dusk Jun 20, peaks Jun 21.",
  },
  {
    name: "Lammas — High Summer",
    date: new Date(2027, 7, 7),
    type: "sabbat",
    description: "Sun at 15° Leo. First harvest — give thanks for the bounty, honor sacrifice, begin the turn toward autumn.",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Begins dusk Aug 6, peaks Aug 7.",
  },
  {
    name: "Mabon — Autumn Equinox",
    date: new Date(2027, 8, 22),
    type: "sabbat",
    description: "Sun enters Libra at 2:02 PM ET. Balance and gratitude — second harvest, equal day and night once more.",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Begins dusk Sep 21, peaks Sep 22.",
  },
  {
    name: "Samhain — High Autumn",
    date: new Date(2027, 10, 7),
    type: "sabbat",
    description: "Sun at 15° Scorpio. The veil thins — honor the beloved dead and ancestors on the greatest spirit night of the year.",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Begins dusk Nov 6, peaks Nov 7.",
  },
  {
    name: "Yule — Winter Solstice",
    date: new Date(2027, 11, 21),
    type: "sabbat",
    description: "Sun enters Capricorn at 9:42 PM ET. The longest night and the rebirth of light — the sacred pause before the solar return.",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Begins dusk Dec 20, peaks Dec 21.",
  },
];

// 2026 Named Full Moons (aligned with USNO major-phase dates)
// Timing source: Heron Michelle / Patheos "2026 Wheel of the Year Astrological Calendar for Witches"
export const NAMED_FULL_MOONS: WheelEvent[] = [
  {
    name: "Cold Full Moon",
    date: new Date(2026, 0, 3),
    type: "named-moon",
    description: "Full Moon in Cancer. Exact opposition Saturday, January 3 at 5:03 am.",
    sign: "Cancer",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated the night before on Friday, January 2, within 13 hours of exact opposition.",
  },
  {
    name: "Quickening Full Moon",
    date: new Date(2026, 1, 1),
    type: "named-moon",
    description: "Full Moon in Leo. Exact opposition Sunday, January 31 at 5:09 pm.",
    sign: "Leo",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated the night before (Saturday, January 30) after the moon enters Aquarius at 7:09 pm — or hold jointly with Imbolc Sabbat weekend celebrations.",
  },
  {
    name: "Storm Full Moon",
    date: new Date(2026, 2, 3),
    type: "named-moon",
    description: "Full Moon in Virgo — Lunar Eclipse. Exact opposition Tuesday, March 3 at 6:38 am.",
    sign: "Virgo",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Best celebrated the night before on Monday, March 2 — anytime after the moon enters Virgo at 7:34 am, or within 13 hours of exact opposition.",
  },
  {
    name: "Wind Full Moon",
    date: new Date(2026, 3, 2),
    type: "named-moon",
    description: "Full Moon in Libra. Exact opposition Wednesday, April 1 at 10:12 pm.",
    sign: "Libra",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated that night (Wednesday, April 1) within 13 hours prior to exact opposition.",
  },
  {
    name: "Flower Full Moon",
    date: new Date(2026, 4, 1),
    type: "named-moon",
    description: "Full Moon in Scorpio. Exact opposition Friday, May 1 at 1:23 pm.",
    sign: "Scorpio",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the night before (Thursday, April 30) after the moon enters Scorpio at 3:02 pm — or within 13 hours of exact opposition.",
  },
  {
    name: "Strong Sun Full Moon",
    date: new Date(2026, 4, 31),
    type: "named-moon",
    description: "Full Moon in Sagittarius. Exact opposition Sunday, May 31 at 4:45 am.",
    sign: "Sagittarius",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Best celebrated the night before (Saturday, May 30) after the moon enters Sagittarius at 8:45 am — or within 13 hours of exact opposition.",
  },
  {
    name: "Blessing Full Moon",
    date: new Date(2026, 5, 29),
    type: "named-moon",
    description: "Full Moon in Capricorn. Exact opposition Monday, June 29 at 7:57 pm.",
    sign: "Capricorn",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Narrow window — celebrate between the moon entering Capricorn at 3:19 am and exact opposition at 7:57 pm on June 29.",
  },
  {
    name: "Corn Full Moon",
    date: new Date(2026, 6, 29),
    type: "named-moon",
    description: "Full Moon in Aquarius. Exact opposition Wednesday, July 29 at 10:36 am.",
    sign: "Aquarius",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Best celebrated the night before (Tuesday, July 28) after the moon enters Aquarius at 9:46 pm — or within 13 hours of exact opposition.",
  },
  {
    name: "Harvest Full Moon",
    date: new Date(2026, 7, 28),
    type: "named-moon",
    description: "Full Moon in Pisces — Lunar Eclipse. Exact opposition Friday, August 28 at 12:18 am.",
    sign: "Pisces",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated the night before (Thursday, August 27) after the moon enters Pisces at 3:04 pm — or within 13 hours of exact opposition.",
  },
  {
    name: "Blood Full Moon",
    date: new Date(2026, 8, 26),
    type: "named-moon",
    description: "Full Moon in Aries. Exact opposition Saturday, September 26 at 12:49 pm.",
    sign: "Aries",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Narrow window — celebrate between the moon entering Aries at 6:23 am and exact opposition at 12:49 pm. May be held jointly with Mabon Sabbat.",
  },
  {
    name: "Mourning Full Moon",
    date: new Date(2026, 9, 26),
    type: "named-moon",
    description: "Full Moon in Taurus. Exact opposition Monday, October 26 at 12:12 am.",
    sign: "Taurus",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Narrow window — best begun Sunday evening, October 25 after the moon enters Taurus at 7:35 pm, with exact opposition 4 hours 47 minutes later.",
  },
  {
    name: "Long Nights Full Moon",
    date: new Date(2026, 10, 24),
    type: "named-moon",
    description: "Full Moon in Gemini. Exact opposition Tuesday, November 24 at 9:53 am.",
    sign: "Gemini",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated the prior evening on Monday, November 23 — anytime, or within 13 hours prior to exact opposition.",
  },
  // ── 2027 Named Full Moons (source: Heron Michelle / Patheos) ─────────────────
  {
    name: "Quickening Full Moon · Wolf Moon",
    date: new Date(2027, 0, 22),
    type: "named-moon",
    description: "Full Moon in Leo. Exact opposition Friday, January 22 at 7:17 AM ET. The first full moon of 2027 rises in bold Leo — let its fire illuminate what needs to quicken within you.",
    sign: "Leo",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated the prior evening (Thursday, January 21) or within 13 hours before the exact opposition.",
  },
  {
    name: "Storm Full Moon · Snow Moon",
    date: new Date(2027, 1, 20),
    type: "named-moon",
    description: "Full Moon in Virgo — Lunar Eclipse. Exact opposition Saturday, February 20 at 6:14 PM ET. A lunar eclipse during the Snow Moon magnifies the work of release; the Virgo opposition calls for purification and discernment.",
    sign: "Virgo",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Best celebrated the prior evening (Friday, February 19) or within 13 hours before the exact opposition.",
  },
  {
    name: "Wind Full Moon · Worm Moon",
    date: new Date(2027, 2, 22),
    type: "named-moon",
    description: "Full Moon in Libra. Exact opposition Monday, March 22 at 6:44 AM ET. Arriving two days after Ostara, this moon amplifies the equinox balance — an ideal moment for relationship magic and harmonizing intentions.",
    sign: "Libra",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the prior evening (Sunday, March 21) or within 13 hours before the exact opposition.",
  },
  {
    name: "Flower Full Moon · Pink Moon",
    date: new Date(2027, 3, 20),
    type: "named-moon",
    description: "Full Moon in Scorpio. Exact opposition Tuesday, April 20 at 6:27 PM ET. A Scorpio full moon in the height of spring invites deep transformation beneath the blossoming surface.",
    sign: "Scorpio",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the prior evening (Monday, April 19) or within 13 hours before the exact opposition.",
  },
  {
    name: "Blue Moon · Flower Moon",
    date: new Date(2027, 4, 20),
    type: "named-moon",
    description: "Full Moon in Scorpio — Blue Moon (third of four full moons this season). Exact opposition Thursday, May 20 at 6:59 AM ET. The blue moon marks a rare deepening of the Scorpio tide; lunar leadership now shifts toward the dark moon as the primary ceremonial moment per the Heron Michelle framework.",
    sign: "Scorpio",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    isBlueMoon: true,
    timing: "Best celebrated the prior evening (Wednesday, May 19) or within 13 hours before the exact opposition.",
  },
  {
    name: "Strong Sun Full Moon · Strawberry Moon",
    date: new Date(2027, 5, 18),
    type: "named-moon",
    description: "Full Moon in Sagittarius. Exact opposition Friday, June 18 at 8:44 PM ET. Rising just before Litha, this moon in Sagittarius calls for bold visions and expansive summer intentions.",
    sign: "Sagittarius",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Best celebrated the prior evening (Thursday, June 17) or within 13 hours before the exact opposition.",
  },
  {
    name: "Blessing Full Moon · Buck Moon",
    date: new Date(2027, 6, 18),
    type: "named-moon",
    description: "Full Moon in Capricorn — Lunar Eclipse. Exact opposition Sunday, July 18 at 11:45 AM ET. A lunar eclipse in Capricorn during Lammastide calls for honoring structures worth preserving and releasing what no longer builds toward your highest good.",
    sign: "Capricorn",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Best celebrated the prior evening (Saturday, July 17) or within 13 hours before the exact opposition.",
  },
  {
    name: "Corn Full Moon · Sturgeon Moon",
    date: new Date(2027, 7, 17),
    type: "named-moon",
    description: "Full Moon in Aquarius — Lunar Eclipse. Exact opposition Tuesday, August 17 at 3:29 AM ET. This eclipse in the water-bearer sign lights up collective ideals — a powerful time to align personal harvest goals with community vision.",
    sign: "Aquarius",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated the prior evening (Monday, August 16) or within 13 hours before the exact opposition.",
  },
  {
    name: "Harvest Full Moon · Corn Moon",
    date: new Date(2027, 8, 15),
    type: "named-moon",
    description: "Full Moon in Pisces. Exact opposition Wednesday, September 15 at 7:03 PM ET. The harvest moon in Pisces infuses the reaping season with compassion and spiritual depth.",
    sign: "Pisces",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated the prior evening (Tuesday, September 14) or within 13 hours before the exact opposition.",
  },
  {
    name: "Blood Full Moon · Hunters Moon",
    date: new Date(2027, 9, 15),
    type: "named-moon",
    description: "Full Moon in Aries. Exact opposition Friday, October 15 at 9:47 AM ET. An Aries full moon during Samhaintide burns through the veil with ancestral fire — face what must be faced.",
    sign: "Aries",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Best celebrated the prior evening (Thursday, October 14) or within 13 hours before the exact opposition.",
  },
  {
    name: "Mourning Full Moon · Beaver Moon",
    date: new Date(2027, 10, 13),
    type: "named-moon",
    description: "Full Moon in Taurus. Exact opposition Saturday, November 13 at 10:26 PM ET. As winter's quiet approaches, this Taurus full moon grounds the grief and gratitude of Samhaintide in the body.",
    sign: "Taurus",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated the prior evening (Friday, November 12) or within 13 hours before the exact opposition.",
  },
  {
    name: "Long Nights Full Moon · Cold Moon",
    date: new Date(2027, 11, 13),
    type: "named-moon",
    description: "Full Moon in Gemini. Exact opposition Monday, December 13 at 11:09 AM ET. The long nights moon illuminates the deep quiet before Yule — listen to what the darkness has to say.",
    sign: "Gemini",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated the prior evening (Sunday, December 12) or within 13 hours before the exact opposition.",
  },
  // ── 2028 Named Full Moons (folk names, supermoon/blue-moon flags) ─────────────
  { name: "Wolf Moon", date: new Date(2028, 0, 12), type: "named-moon", description: "Full Moon in Cancer — Supermoon. The first full moon of 2028 rises close to Earth, appearing larger and brighter than average.", isSupermoon: true },
  { name: "Snow Moon", date: new Date(2028, 1, 10), type: "named-moon", description: "Full Moon in Leo — Supermoon. The second supermoon of 2028 in the heart of winter.", isSupermoon: true },
  { name: "Worm Moon", date: new Date(2028, 2, 11), type: "named-moon", description: "Full Moon in Virgo — Supermoon. Third consecutive supermoon; the worm moon signals the ground softening for spring.", isSupermoon: true },
  { name: "Pink Moon", date: new Date(2028, 3, 9), type: "named-moon", description: "Full Moon in Libra. Named for the pink phlox wildflowers that bloom in early spring." },
  { name: "Flower Moon", date: new Date(2028, 4, 8), type: "named-moon", description: "Full Moon in Scorpio. The abundance of spring blossoms marks this moon's name." },
  { name: "Strawberry Moon", date: new Date(2028, 5, 7), type: "named-moon", description: "Full Moon in Sagittarius. Named for the strawberry harvesting season." },
  { name: "Buck Moon", date: new Date(2028, 6, 6), type: "named-moon", description: "Full Moon in Capricorn. Named for the time of year when deer begin growing their antlers." },
  { name: "Sturgeon Moon", date: new Date(2028, 7, 5), type: "named-moon", description: "Full Moon in Aquarius. Named for the large sturgeon fish historically caught in the Great Lakes at this time." },
  { name: "Corn Moon", date: new Date(2028, 8, 3), type: "named-moon", description: "Full Moon in Pisces. Named for the ripening of corn in late summer." },
  { name: "Hunters Moon", date: new Date(2028, 9, 3), type: "named-moon", description: "Full Moon in Aries. Named for the traditional hunting season that begins after harvest." },
  { name: "Beaver Moon", date: new Date(2028, 10, 2), type: "named-moon", description: "Full Moon in Taurus. Named for the time when beavers were trapped for warm winter pelts." },
  { name: "Cold Moon", date: new Date(2028, 11, 2), type: "named-moon", description: "Full Moon in Gemini. Named for the long, cold nights that begin at this time of year." },
  { name: "Blue Moon", date: new Date(2028, 11, 31), type: "named-moon", description: "Full Moon in Cancer — Blue Moon (rare second full moon in the same calendar month, December 2028). The next December blue moon of this type is decades away.", isBlueMoon: true },
  // ── 2029 Named Full Moons ────────────────────────────────────────────────────
  { name: "Wolf Moon", date: new Date(2029, 0, 30), type: "named-moon", description: "Full Moon in Leo. The Wolf Moon howls at the height of winter." },
  { name: "Snow Moon", date: new Date(2029, 1, 28), type: "named-moon", description: "Full Moon in Virgo — Supermoon. The Snow Moon rises close to Earth during the heart of winter.", isSupermoon: true },
  { name: "Worm Moon", date: new Date(2029, 2, 30), type: "named-moon", description: "Full Moon in Libra — Supermoon. Second consecutive supermoon of 2029; arrives just after the spring equinox.", isSupermoon: true },
  { name: "Pink Moon", date: new Date(2029, 3, 28), type: "named-moon", description: "Full Moon in Scorpio — Supermoon. Third consecutive supermoon; the pink moon blooms in bold Scorpio.", isSupermoon: true },
  { name: "Flower Moon", date: new Date(2029, 4, 27), type: "named-moon", description: "Full Moon in Sagittarius. Named for the profusion of spring blossoms." },
  { name: "Strawberry Moon", date: new Date(2029, 5, 26), type: "named-moon", description: "Full Moon in Capricorn. Named for the ripening of the first summer strawberries." },
  { name: "Buck Moon", date: new Date(2029, 6, 25), type: "named-moon", description: "Full Moon in Aquarius. Named for deer in the season of antler growth." },
  { name: "Sturgeon Moon", date: new Date(2029, 7, 24), type: "named-moon", description: "Full Moon in Pisces — Blue Moon (third of four full moons in this season). A seasonal blue moon adds an extra layer of potency to summer's closing rites.", isBlueMoon: true },
  { name: "Corn Moon", date: new Date(2029, 8, 22), type: "named-moon", description: "Full Moon in Aries. Named for the end-of-summer corn harvest." },
  { name: "Hunters Moon", date: new Date(2029, 9, 22), type: "named-moon", description: "Full Moon in Taurus. Named for the prime hunting season following the harvest." },
  { name: "Beaver Moon", date: new Date(2029, 10, 21), type: "named-moon", description: "Full Moon in Gemini. Named for the beaver-trapping season that begins with the first hard frosts." },
  { name: "Cold Moon", date: new Date(2029, 11, 20), type: "named-moon", description: "Full Moon in Cancer. Named for the long cold nights of early winter." },
  // ── 2030 Named Full Moons ────────────────────────────────────────────────────
  { name: "Wolf Moon", date: new Date(2030, 0, 19), type: "named-moon", description: "Full Moon in Leo. The first full moon of 2030 rises in bold Leo, the hunter's moon of midwinter." },
  { name: "Snow Moon", date: new Date(2030, 1, 18), type: "named-moon", description: "Full Moon in Virgo. Named for the heavy snowfalls of February." },
  { name: "Worm Moon", date: new Date(2030, 2, 19), type: "named-moon", description: "Full Moon in Libra. The worm moon heralds the return of earthworms as the ground thaws." },
  { name: "Pink Moon", date: new Date(2030, 3, 18), type: "named-moon", description: "Full Moon in Scorpio. Named for the pink phlox blossoming across the eastern woodlands." },
  { name: "Flower Moon", date: new Date(2030, 4, 17), type: "named-moon", description: "Full Moon in Sagittarius. Named for the peak of spring blooming across the Northern Hemisphere." },
  { name: "Strawberry Moon", date: new Date(2030, 5, 15), type: "named-moon", description: "Full Moon in Capricorn. Named for the brief strawberry harvest season." },
  { name: "Buck Moon", date: new Date(2030, 6, 15), type: "named-moon", description: "Full Moon in Aquarius. Named for the summer season of antler growth in white-tailed deer." },
  { name: "Sturgeon Moon", date: new Date(2030, 7, 13), type: "named-moon", description: "Full Moon in Aquarius. Named for the abundance of sturgeon in the Great Lakes." },
  { name: "Corn Moon", date: new Date(2030, 8, 11), type: "named-moon", description: "Full Moon in Pisces. Named for the maturing of corn in late summer." },
  { name: "Hunters Moon", date: new Date(2030, 9, 11), type: "named-moon", description: "Full Moon in Aries. Named for the hunting season that follows the harvest." },
  { name: "Beaver Moon", date: new Date(2030, 10, 10), type: "named-moon", description: "Full Moon in Taurus. Named for the prime trapping season as beavers prepare their winter lodges." },
  { name: "Cold Moon", date: new Date(2030, 11, 9), type: "named-moon", description: "Full Moon in Gemini. Named for the long cold nights of early winter." },
];

// 2026 Dark Moons (aligned with USNO new-moon dates)
// Timing source: Heron Michelle / Patheos "2026 Wheel of the Year Astrological Calendar for Witches"
export const DARK_MOONS: WheelEvent[] = [
  {
    name: "Dark Moon",
    date: new Date(2026, 0, 18),
    type: "dark-moon",
    description: "Dark Moon in Capricorn. Exact conjunction Sunday, January 18 at 2:52 pm.",
    sign: "Capricorn",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated within 13 hours prior to exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 1, 17),
    type: "dark-moon",
    description: "Dark Moon in Aquarius — Solar Eclipse / Lunar New Year (Year of the Horse). Exact conjunction Tuesday, February 17 at 7:01 am.",
    sign: "Aquarius",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated within 13 hours prior to conjunction — the night before on February 16.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 2, 19),
    type: "dark-moon",
    description: "Dark Moon in Pisces. Exact conjunction Wednesday, March 18 at 9:23 pm.",
    sign: "Pisces",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Best celebrated within 13 hours prior to exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 3, 17),
    type: "dark-moon",
    description: "Dark Moon in Aries. Exact conjunction Friday, April 17 at 7:52 am.",
    sign: "Aries",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the night before — anytime, or within 13 hours prior to conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 4, 16),
    type: "dark-moon",
    description: "Dark Moon in Taurus. Exact conjunction Saturday, May 16 at 4:01 pm.",
    sign: "Taurus",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the night before — anytime, or within 13 hours of exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 5, 14),
    type: "dark-moon",
    description: "Dark Moon in Gemini. Exact conjunction Sunday, June 14 at 10:54 pm.",
    sign: "Gemini",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Best celebrated that night (Sunday, June 14) prior to 10:54 pm — or within 13 hours prior to conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 6, 14),
    type: "dark-moon",
    description: "Dark Moon in Cancer. Exact conjunction Tuesday, July 14 at 5:44 am.",
    sign: "Cancer",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Best celebrated the night before — anytime, or within 13 hours before conjunction at 5:44 am.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 7, 12),
    type: "dark-moon",
    description: "Dark Moon in Leo — Solar Eclipse. Exact conjunction Wednesday, August 12 at 1:37 pm.",
    sign: "Leo",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated the night before — anytime, or within 13 hours before conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 8, 12),
    type: "dark-moon",
    description: "Dark Moon in Virgo. Exact conjunction Thursday, September 10 at 11:27 pm.",
    sign: "Virgo",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated within 13 hours prior to exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 9, 11),
    type: "dark-moon",
    description: "Dark Moon in Libra. Exact conjunction Saturday, October 10 at 11:50 am.",
    sign: "Libra",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Best celebrated the night before — anytime, or within 13 hours prior to exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 10, 9),
    type: "dark-moon",
    description: "Dark Moon in Scorpio. Exact conjunction Monday, November 9 at 2:02 am.",
    sign: "Scorpio",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated the prior evening on Sunday, November 8 — anytime, or within 13 hours prior to exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2026, 11, 9),
    type: "dark-moon",
    description: "Dark Moon in Sagittarius. Exact conjunction Tuesday, December 8 at 7:52 pm.",
    sign: "Sagittarius",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated that day (December 8) within 13 hours prior to exact conjunction.",
  },
  // ── 2027 Dark Moons (source: Heron Michelle / Patheos) ──────────────────────
  {
    name: "Dark Moon",
    date: new Date(2027, 0, 7),
    type: "dark-moon",
    description: "Dark Moon in Capricorn. Exact conjunction Thursday, January 7 at 3:24 PM ET.",
    sign: "Capricorn",
    tide: "Imbolctide",
    polarity: "Waxing",
    element: "Earth Receptive",
    intent: "To Resonate",
    timing: "Best celebrated the morning of January 7 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 1, 6),
    type: "dark-moon",
    description: "Dark Moon in Aquarius — Solar Eclipse. Exact conjunction Saturday, February 6 at 10:56 AM ET. A solar eclipse amplifies the dark moon portal; intention-setting during an eclipse carries heightened potency.",
    sign: "Aquarius",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Best celebrated the morning of February 6 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 2, 8),
    type: "dark-moon",
    description: "Dark Moon in Pisces. Exact conjunction Monday, March 8 at 4:29 AM ET.",
    sign: "Pisces",
    tide: "Ostaratide",
    polarity: "Waning",
    element: "Air Projective",
    intent: "To Know",
    timing: "Best celebrated the evening of March 7, within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 3, 6),
    type: "dark-moon",
    description: "Dark Moon in Aries. Exact conjunction Tuesday, April 6 at 7:51 PM ET.",
    sign: "Aries",
    tide: "Beltanetide",
    polarity: "Waxing",
    element: "Air Receptive",
    intent: "To Wonder",
    timing: "Best celebrated the afternoon of April 6 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 4, 6),
    type: "dark-moon",
    description: "Dark Moon in Taurus. Exact conjunction Thursday, May 6 at 6:59 AM ET.",
    sign: "Taurus",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Best celebrated the evening of May 5 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 5, 4),
    type: "dark-moon",
    description: "Dark Moon in Gemini. Exact conjunction Friday, June 4 at 3:40 PM ET.",
    sign: "Gemini",
    tide: "Lithatide",
    polarity: "Waning",
    element: "Fire Projective",
    intent: "To Will",
    timing: "Best celebrated the morning of June 4 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 6, 3),
    type: "dark-moon",
    description: "Dark Moon in Cancer. Exact conjunction Saturday, July 3 at 11:02 PM ET.",
    sign: "Cancer",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Best celebrated the afternoon of July 3 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 7, 2),
    type: "dark-moon",
    description: "Dark Moon in Leo — Solar Eclipse. Exact conjunction Monday, August 2 at 6:05 AM ET. A solar eclipse intensifies this new moon window; work done in this portal resonates outward with extra force.",
    sign: "Leo",
    tide: "Lammastide",
    polarity: "Waxing",
    element: "Fire Receptive",
    intent: "To Surrender",
    timing: "Best celebrated the evening of August 1 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 7, 31),
    type: "dark-moon",
    description: "Dark Moon in Virgo. Exact conjunction Tuesday, August 31 at 1:41 PM ET.",
    sign: "Virgo",
    tide: "Mabontide",
    polarity: "Waning",
    element: "Water Projective",
    intent: "To Dare",
    timing: "Best celebrated the morning of August 31 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 8, 29),
    type: "dark-moon",
    description: "Dark Moon in Libra. Exact conjunction Wednesday, September 29 at 10:36 PM ET.",
    sign: "Libra",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Best celebrated the afternoon of September 29 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 9, 29),
    type: "dark-moon",
    description: "Dark Moon in Scorpio. Exact conjunction Friday, October 29 at 9:37 AM ET.",
    sign: "Scorpio",
    tide: "Samhaintide",
    polarity: "Waxing",
    element: "Water Receptive",
    intent: "To Accept",
    timing: "Best celebrated the evening of October 28 within 13 hours before the exact conjunction.",
  },
  {
    name: "Dark Moon",
    date: new Date(2027, 10, 27),
    type: "dark-moon",
    description: "Dark Moon in Sagittarius. Exact conjunction Saturday, November 27 at 10:24 PM ET.",
    sign: "Sagittarius",
    tide: "Yuletide",
    polarity: "Waning",
    element: "Earth Projective",
    intent: "To be Silent",
    timing: "Best celebrated the afternoon of November 27 within 13 hours before the exact conjunction.",
  },
];

// 2026 Eclipses (aligned with USNO major-phase dates)
export const ECLIPSES: WheelEvent[] = [
  {
    name: "Solar Eclipse",
    date: new Date(2026, 1, 17),
    type: "solar-eclipse",
    description: "Solar Eclipse — Dark Moon in Aquarius. Powerful portal for new beginnings. Also Lunar New Year (Year of the Horse).",
    sign: "Aquarius",
  },
  {
    name: "Lunar Eclipse",
    date: new Date(2026, 2, 3),
    type: "lunar-eclipse",
    description: "Lunar Eclipse — Storm Full Moon in Virgo. Deep release and illumination of what must be healed.",
    sign: "Virgo",
  },
  {
    name: "Solar Eclipse",
    date: new Date(2026, 7, 12),
    type: "solar-eclipse",
    description: "Solar Eclipse — Dark Moon in Leo. A powerful reset at the height of summer — bold intentions carry extra force.",
    sign: "Leo",
  },
  {
    name: "Lunar Eclipse",
    date: new Date(2026, 7, 28),
    type: "lunar-eclipse",
    description: "Lunar Eclipse — Harvest Full Moon in Pisces. Dissolution of what no longer serves — surrender with trust.",
    sign: "Pisces",
  },
];

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getMercuryRetrogradeInfo(date: Date): RetrogradePeriod | null {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return MERCURY_RETROGRADES.find((r) => d >= r.start && d <= r.end) ?? null;
}

export function isIfaPrayerDay(date: Date): boolean {
  return date.getDay() === 4;
}

export function getIfaFestivalForDate(date: Date): IfaFestival | null {
  return IFA_FESTIVALS.find((f) => isSameDay(f.date, date)) ?? null;
}

export function getSabbatForDate(date: Date): WheelEvent | null {
  return SABBATS.find((s) => isSameDay(s.date, date)) ?? null;
}

export function getNamedFullMoonForDate(date: Date): WheelEvent | null {
  return NAMED_FULL_MOONS.find((m) => isSameDay(m.date, date)) ?? null;
}

export function getDarkMoonForDate(date: Date): WheelEvent | null {
  return DARK_MOONS.find((m) => isSameDay(m.date, date)) ?? null;
}

export function getEclipseForDate(date: Date): WheelEvent | null {
  return ECLIPSES.find((e) => isSameDay(e.date, date)) ?? null;
}

/** Build the structured metadata rows for any WheelEvent (sabbat, named moon, dark moon). */
export function getTidalRows(event: WheelEvent): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (event.sign)     rows.push({ label: "Sign",     value: event.sign });
  if (event.tide)     rows.push({ label: "Tide",     value: event.tide });
  if (event.polarity) rows.push({ label: "Polarity", value: event.polarity });
  if (event.element)  rows.push({ label: "Element",  value: event.element });
  if (event.intent)   rows.push({ label: "Intent",   value: event.intent });
  if (event.timing)   rows.push({ label: "Timing",   value: event.timing });
  return rows;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getEventsForDate(date: Date): SpiritualEvent[] {
  const events: SpiritualEvent[] = [];
  const moonData = getMoonPhaseData(date);
  const retrograde = getMercuryRetrogradeInfo(date);
  const isPrayerDay = isIfaPrayerDay(date);
  const festival = getIfaFestivalForDate(date);
  const sabbat = getSabbatForDate(date);
  const namedMoon = getNamedFullMoonForDate(date);
  const darkMoon = getDarkMoonForDate(date);
  const eclipse = getEclipseForDate(date);
  const astro = getAstroEventForDate(date);

  // Named full moons override the generic moon event if present
  if (namedMoon) {
    events.push({
      id: `named-moon-${date.toDateString()}`,
      type: "named-moon",
      name: namedMoon.name,
      description: namedMoon.description,
      color: EVENT_COLORS["named-moon"],
      date,
    });
  } else if (darkMoon) {
    events.push({
      id: `dark-moon-${date.toDateString()}`,
      type: "dark-moon",
      name: darkMoon.name,
      description: darkMoon.description,
      color: EVENT_COLORS["dark-moon"],
      date,
    });
  } else {
    events.push({
      id: `moon-${date.toDateString()}`,
      type: moonData.eventType,
      name: moonData.name,
      description: `${moonData.illumination}% illuminated`,
      color: EVENT_COLORS[moonData.eventType],
      date,
    });
  }

  if (eclipse) {
    events.push({
      id: `eclipse-${date.toDateString()}`,
      type: eclipse.type,
      name: eclipse.name,
      description: eclipse.description,
      color: EVENT_COLORS[eclipse.type],
      date,
    });
  }

  if (sabbat) {
    events.push({
      id: `sabbat-${date.toDateString()}`,
      type: "sabbat",
      name: sabbat.name,
      description: sabbat.description,
      color: EVENT_COLORS.sabbat,
      date,
    });
  }

  if (retrograde) {
    events.push({
      id: `retrograde-${date.toDateString()}`,
      type: "retrograde",
      name: "Mercury Retrograde",
      description: retrograde.label,
      color: EVENT_COLORS.retrograde,
      date,
      endDate: retrograde.end,
    });
  }

  if (isPrayerDay) {
    events.push({
      id: `ifa-prayer-${date.toDateString()}`,
      type: "ifa-prayer",
      name: "Ifa Prayer Day",
      description: "Ojo Orunmila — Sacred day of the Ifa Oracle",
      color: EVENT_COLORS["ifa-prayer"],
      date,
    });
  }

  if (festival) {
    events.push({
      id: `ifa-festival-${date.toDateString()}`,
      type: "ifa-festival",
      name: festival.name,
      description: festival.description,
      color: EVENT_COLORS["ifa-festival"],
      date,
    });
  }

  if (astro) {
    events.push({
      id: `astro-${date.toDateString()}`,
      type: astro.type,
      name: astro.name,
      description: astro.description,
      color: EVENT_COLORS[astro.type],
      date,
      endDate: astro.endDate,
    });
  }

  return events;
}

// ─── Astronomical Events (2026) — sourced from GO ASTRONOMY ───────────────────

export interface AstronomicalEvent {
  name: string;
  date: Date;
  type: EventType;
  description: string;
  endDate?: Date;
}

export const ASTRO_EVENTS: AstronomicalEvent[] = [
  // Meteor Showers
  { name: "Quadrantids Meteor Shower", date: new Date(2026, 0, 3), type: "meteor-shower", description: "One of the year's most reliable meteor showers, with up to 100 meteors per hour. Best viewing before dawn in the Northern Hemisphere.", endDate: new Date(2026, 0, 4) },
  { name: "Lyrid Meteor Shower", date: new Date(2026, 3, 22), type: "meteor-shower", description: "Spring meteor shower originating from the constellation Lyra. Active April 16–25, peak night April 22–23.", endDate: new Date(2026, 3, 23) },
  { name: "Eta Aquarid Meteor Shower", date: new Date(2026, 4, 6), type: "meteor-shower", description: "Meteor shower from Halley's Comet debris. Best seen in the Southern Hemisphere before dawn.", endDate: new Date(2026, 4, 7) },
  { name: "Delta Aquarids Meteor Shower", date: new Date(2026, 6, 28), type: "meteor-shower", description: "Meteor shower from the constellation Aquarius. Best viewing in the Southern Hemisphere.", endDate: new Date(2026, 6, 29) },
  { name: "Perseid Meteor Shower", date: new Date(2026, 7, 12), type: "meteor-shower", description: "The most famous annual meteor shower, with up to 60 meteors per hour. Best viewed in the Northern Hemisphere.", endDate: new Date(2026, 7, 13) },
  { name: "Draconids Meteor Shower", date: new Date(2026, 9, 7), type: "meteor-shower", description: "Meteor shower from the constellation Draco. Best viewing in the early evening.", endDate: new Date(2026, 9, 7) },
  { name: "Orionid Meteor Shower", date: new Date(2026, 9, 21), type: "meteor-shower", description: "Meteor shower from Halley's Comet debris. Best viewed before dawn.", endDate: new Date(2026, 9, 22) },
  { name: "Taurids Meteor Shower", date: new Date(2026, 10, 4), type: "meteor-shower", description: "Long-duration meteor shower from the constellation Taurus. Known for exceptionally bright fireballs.", endDate: new Date(2026, 10, 5) },
  { name: "Leonid Meteor Shower", date: new Date(2026, 10, 17), type: "meteor-shower", description: "Meteor shower from the constellation Leo. Known for spectacular meteor storms every 33 years.", endDate: new Date(2026, 10, 18) },
  { name: "Geminid Meteor Shower", date: new Date(2026, 11, 13), type: "meteor-shower", description: "The year's most spectacular meteor shower, with up to 120 meteors per hour. Best viewing in the Northern Hemisphere.", endDate: new Date(2026, 11, 14) },
  { name: "Ursid Meteor Shower", date: new Date(2026, 11, 21), type: "meteor-shower", description: "Winter meteor shower from the constellation Ursa Minor. Modest but consistent viewing.", endDate: new Date(2026, 11, 22) },
  // Planet Oppositions
  { name: "Jupiter at Opposition", date: new Date(2026, 0, 10), type: "planet-opposition", description: "Jupiter is at its brightest and closest approach to Earth, visible all night in the constellation Taurus." },
  { name: "Saturn at Opposition", date: new Date(2026, 9, 4), type: "planet-opposition", description: "Saturn is at its brightest and closest approach to Earth, its rings visible with even a small telescope." },
  { name: "Neptune at Opposition", date: new Date(2026, 8, 25), type: "planet-opposition", description: "Neptune is at its brightest and closest approach to Earth, visible in the constellation Aquarius." },
  { name: "Uranus at Opposition", date: new Date(2026, 10, 25), type: "planet-opposition", description: "Uranus is at its brightest and closest approach to Earth, visible in the constellation Aries." },
  // Planet Elongations
  { name: "Mercury at Greatest Western Elongation", date: new Date(2026, 0, 7), type: "planet-elongation", description: "Mercury is at its greatest western elongation, best seen in the eastern sky before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2026, 1, 19), type: "planet-elongation", description: "Mercury is at its greatest eastern elongation, best seen in the western sky after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2026, 3, 3), type: "planet-elongation", description: "Mercury is at its greatest western elongation, best seen in the eastern sky before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2026, 5, 15), type: "planet-elongation", description: "Mercury is at its greatest eastern elongation, best seen in the western sky after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2026, 7, 2), type: "planet-elongation", description: "Mercury is at its greatest western elongation, best seen in the eastern sky before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2026, 9, 12), type: "planet-elongation", description: "Mercury is at its greatest eastern elongation, best seen in the western sky after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2026, 10, 20), type: "planet-elongation", description: "Mercury is at its greatest western elongation, best seen in the eastern sky before sunrise." },
  { name: "Venus at Greatest Eastern Elongation", date: new Date(2026, 7, 15), type: "planet-elongation", description: "Venus is at its greatest eastern elongation, shining as the 'Evening Star' in the western sky after sunset." },
  // Solstices & Equinoxes
  { name: "December Solstice", date: new Date(2025, 11, 21), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
  { name: "March Equinox", date: new Date(2026, 2, 20), type: "equinox", description: "The spring equinox — day and night are equal in length. The Sun crosses the celestial equator moving northward." },
  { name: "June Solstice", date: new Date(2026, 5, 21), type: "solstice", description: "The summer solstice — the longest day of the year in the Northern Hemisphere. The Sun reaches its northernmost point." },
  { name: "September Equinox", date: new Date(2026, 8, 23), type: "equinox", description: "The autumn equinox — day and night are equal in length. The Sun crosses the celestial equator moving southward." },
  { name: "December Solstice", date: new Date(2026, 11, 21), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
  // ── 2027 ────────────────────────────────────────────────────────────────────
  // Meteor showers
  { name: "Quadrantids Meteor Shower", date: new Date(2027, 0, 3), type: "meteor-shower", description: "One of the strongest annual meteor showers, peaking from the radiant in Boötes. Best viewed in the hours before dawn.", endDate: new Date(2027, 0, 4) },
  { name: "Lyrids Meteor Shower", date: new Date(2027, 3, 22), type: "meteor-shower", description: "Annual meteor shower originating from the debris of Comet Thatcher. Look toward the constellation Lyra after midnight.", endDate: new Date(2027, 3, 23) },
  { name: "Eta Aquarids Meteor Shower", date: new Date(2027, 4, 6), type: "meteor-shower", description: "Debris from Halley's Comet creates swift meteors radiating from Aquarius. Best viewed from the Southern Hemisphere but visible worldwide before dawn.", endDate: new Date(2027, 4, 7) },
  { name: "Delta Aquarids Meteor Shower", date: new Date(2027, 6, 28), type: "meteor-shower", description: "A steady summer shower with meteors radiating from the southern part of Aquarius. Best viewed after midnight.", endDate: new Date(2027, 6, 29) },
  { name: "Perseids Meteor Shower", date: new Date(2027, 7, 12), type: "meteor-shower", description: "One of the most beloved annual showers, originating from Comet Swift-Tuttle. Look toward Perseus after midnight.", endDate: new Date(2027, 7, 13) },
  { name: "Draconids Meteor Shower", date: new Date(2027, 9, 7), type: "meteor-shower", description: "Produced by debris from Comet Giacobini-Zinner; best viewed in the early evening toward the constellation Draco.", endDate: new Date(2027, 9, 7) },
  { name: "Orionids Meteor Shower", date: new Date(2027, 9, 21), type: "meteor-shower", description: "Created by dust from Halley's Comet, radiating from Orion. Fast, bright meteors are visible in the hours after midnight.", endDate: new Date(2027, 9, 22) },
  { name: "Taurids Meteor Shower", date: new Date(2027, 10, 4), type: "meteor-shower", description: "A slow-moving shower from Comet Encke with bright, sporadic fireballs radiating from Taurus.", endDate: new Date(2027, 10, 5) },
  { name: "Leonids Meteor Shower", date: new Date(2027, 10, 17), type: "meteor-shower", description: "Meteors from Comet Tempel-Tuttle radiate from Leo. The shower can produce intense storms in some years.", endDate: new Date(2027, 10, 18) },
  { name: "Geminids Meteor Shower", date: new Date(2027, 11, 13), type: "meteor-shower", description: "Debris from asteroid 3200 Phaethon creates one of the year's best showers. Multicolored meteors radiate from Gemini all night.", endDate: new Date(2027, 11, 14) },
  { name: "Ursids Meteor Shower", date: new Date(2027, 11, 21), type: "meteor-shower", description: "A modest winter shower from Comet Tuttle, radiating from Ursa Minor near the winter solstice.", endDate: new Date(2027, 11, 22) },
  // Planet oppositions
  { name: "Mars at Opposition", date: new Date(2027, 1, 19), type: "planet-event", description: "Mars rises opposite the Sun and shines at its brightest for 2027 — an ideal night for planetary observation." },
  { name: "Jupiter at Opposition", date: new Date(2027, 1, 10), type: "planet-event", description: "Jupiter is at its closest approach to Earth and fully illuminated by the Sun — the best night to view Jupiter and its moons this year." },
  { name: "Saturn at Opposition", date: new Date(2027, 9, 18), type: "planet-event", description: "Saturn rises opposite the Sun, shining bright in the night sky. Its rings are tilted favorably for viewing." },
  { name: "Neptune at Opposition", date: new Date(2027, 8, 28), type: "planet-event", description: "Neptune is at its closest approach to Earth for 2027. Although too faint for the naked eye, a telescope will reveal its blue-green disc." },
  { name: "Uranus at Opposition", date: new Date(2027, 10, 30), type: "planet-event", description: "Uranus reaches opposition, shining at its brightest and rising at sunset. Binoculars reveal it as a pale blue-green dot." },
  // Planet elongations
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2027, 1, 3), type: "planet-event", description: "Mercury reaches its greatest angular separation east of the Sun — look for it low in the western sky just after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2027, 2, 17), type: "planet-event", description: "Mercury appears at its greatest angular distance west of the Sun — best seen in the eastern sky just before sunrise." },
  { name: "Venus at Greatest Western Elongation", date: new Date(2027, 0, 3), type: "planet-event", description: "Venus shines brilliantly in the morning sky at its greatest angular distance from the Sun before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2027, 4, 28), type: "planet-event", description: "Mercury appears at its greatest separation east of the Sun — look for it in the western sky after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2027, 6, 15), type: "planet-event", description: "Mercury visible in the eastern pre-dawn sky at maximum angular distance from the Sun." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2027, 8, 24), type: "planet-event", description: "Mercury visible low in the western sky at dusk, at its greatest evening separation from the Sun." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2027, 10, 4), type: "planet-event", description: "Mercury at maximum morning elongation — visible in the east before sunrise." },
  // Solstices & Equinoxes
  { name: "March Equinox", date: new Date(2027, 2, 20), type: "equinox", description: "The spring equinox — day and night are equal in length. The Sun crosses the celestial equator moving northward." },
  { name: "June Solstice", date: new Date(2027, 5, 21), type: "solstice", description: "The summer solstice — the longest day of the year in the Northern Hemisphere. The Sun reaches its northernmost point." },
  { name: "September Equinox", date: new Date(2027, 8, 23), type: "equinox", description: "The autumn equinox — day and night are equal in length. The Sun crosses the celestial equator moving southward." },
  { name: "December Solstice", date: new Date(2027, 11, 22), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
  // ── 2028 ────────────────────────────────────────────────────────────────────
  // Meteor showers
  { name: "Quadrantids Meteor Shower", date: new Date(2028, 0, 3), type: "meteor-shower", description: "One of the strongest annual meteor showers, peaking from the radiant in Boötes. Best viewed in the hours before dawn.", endDate: new Date(2028, 0, 4) },
  { name: "Lyrids Meteor Shower", date: new Date(2028, 3, 22), type: "meteor-shower", description: "Annual shower from Comet Thatcher, radiating from Lyra after midnight.", endDate: new Date(2028, 3, 23) },
  { name: "Eta Aquarids Meteor Shower", date: new Date(2028, 4, 6), type: "meteor-shower", description: "Halley's Comet debris creates swift pre-dawn meteors from Aquarius.", endDate: new Date(2028, 4, 7) },
  { name: "Delta Aquarids Meteor Shower", date: new Date(2028, 6, 28), type: "meteor-shower", description: "Steady summer shower with meteors from southern Aquarius, best after midnight.", endDate: new Date(2028, 6, 29) },
  { name: "Perseids Meteor Shower", date: new Date(2028, 7, 12), type: "meteor-shower", description: "The beloved annual shower from Comet Swift-Tuttle, radiating from Perseus after midnight.", endDate: new Date(2028, 7, 13) },
  { name: "Draconids Meteor Shower", date: new Date(2028, 9, 7), type: "meteor-shower", description: "Comet Giacobini-Zinner debris; best viewed in the early evening toward Draco.", endDate: new Date(2028, 9, 7) },
  { name: "Orionids Meteor Shower", date: new Date(2028, 9, 21), type: "meteor-shower", description: "Halley's Comet dust radiates from Orion; fast bright meteors after midnight.", endDate: new Date(2028, 9, 22) },
  { name: "Taurids Meteor Shower", date: new Date(2028, 10, 4), type: "meteor-shower", description: "Slow sporadic fireballs from Comet Encke radiating from Taurus.", endDate: new Date(2028, 10, 5) },
  { name: "Leonids Meteor Shower", date: new Date(2028, 10, 17), type: "meteor-shower", description: "Comet Tempel-Tuttle meteors from Leo; intensity varies year to year.", endDate: new Date(2028, 10, 18) },
  { name: "Geminids Meteor Shower", date: new Date(2028, 11, 13), type: "meteor-shower", description: "Asteroid 3200 Phaethon debris creates multicolored meteors from Gemini all night.", endDate: new Date(2028, 11, 14) },
  { name: "Ursids Meteor Shower", date: new Date(2028, 11, 21), type: "meteor-shower", description: "A modest winter shower from Comet Tuttle near the winter solstice.", endDate: new Date(2028, 11, 22) },
  // Planet oppositions
  { name: "Jupiter at Opposition", date: new Date(2028, 2, 12), type: "planet-event", description: "Jupiter at its closest and brightest for 2028 — ideal for observing its cloud bands and Galilean moons." },
  { name: "Saturn at Opposition", date: new Date(2028, 9, 30), type: "planet-event", description: "Saturn rises opposite the Sun, shining bright with its rings visible through a small telescope." },
  { name: "Neptune at Opposition", date: new Date(2028, 8, 30), type: "planet-event", description: "Neptune at its nearest to Earth for 2028 — visible as a faint blue-green point through a telescope." },
  { name: "Uranus at Opposition", date: new Date(2028, 11, 3), type: "planet-event", description: "Uranus at opposition, at its brightest and rising at sunset — binoculars show its blue-green tint." },
  // Planet elongations
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2028, 0, 17), type: "planet-event", description: "Mercury visible low in the western sky after sunset at maximum evening elongation." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2028, 1, 27), type: "planet-event", description: "Mercury at maximum morning elongation — look for it in the eastern pre-dawn sky." },
  { name: "Venus at Greatest Eastern Elongation", date: new Date(2028, 2, 22), type: "planet-event", description: "Venus blazes in the evening sky at its greatest angular distance east of the Sun." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2028, 4, 9), type: "planet-event", description: "Mercury at greatest evening elongation — visible in the west after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2028, 5, 26), type: "planet-event", description: "Mercury at greatest morning elongation — visible in the east before sunrise." },
  { name: "Venus at Greatest Western Elongation", date: new Date(2028, 7, 11), type: "planet-event", description: "Venus at its brightest in the morning sky, rising well before the Sun." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2028, 8, 6), type: "planet-event", description: "Mercury at greatest evening elongation, visible after sunset in the west." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2028, 9, 17), type: "planet-event", description: "Mercury at maximum morning elongation, visible in the east before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2028, 11, 31), type: "planet-event", description: "Mercury ends the year at greatest evening elongation — look for it in the western twilight." },
  // Solstices & Equinoxes
  { name: "March Equinox", date: new Date(2028, 2, 20), type: "equinox", description: "The spring equinox — day and night are equal in length. The Sun crosses the celestial equator moving northward." },
  { name: "June Solstice", date: new Date(2028, 5, 20), type: "solstice", description: "The summer solstice — the longest day of the year in the Northern Hemisphere. The Sun reaches its northernmost point." },
  { name: "September Equinox", date: new Date(2028, 8, 22), type: "equinox", description: "The autumn equinox — day and night are equal in length. The Sun crosses the celestial equator moving southward." },
  { name: "December Solstice", date: new Date(2028, 11, 21), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
  // ── 2029 ────────────────────────────────────────────────────────────────────
  // Meteor showers
  { name: "Quadrantids Meteor Shower", date: new Date(2029, 0, 3), type: "meteor-shower", description: "One of the strongest annual showers from Boötes, peaking before dawn.", endDate: new Date(2029, 0, 4) },
  { name: "Lyrids Meteor Shower", date: new Date(2029, 3, 22), type: "meteor-shower", description: "Annual shower from Comet Thatcher, radiating from Lyra after midnight.", endDate: new Date(2029, 3, 23) },
  { name: "Eta Aquarids Meteor Shower", date: new Date(2029, 4, 6), type: "meteor-shower", description: "Halley's Comet debris; swift pre-dawn meteors from Aquarius.", endDate: new Date(2029, 4, 7) },
  { name: "Delta Aquarids Meteor Shower", date: new Date(2029, 6, 28), type: "meteor-shower", description: "Steady summer shower from southern Aquarius, best after midnight.", endDate: new Date(2029, 6, 29) },
  { name: "Perseids Meteor Shower", date: new Date(2029, 7, 12), type: "meteor-shower", description: "Comet Swift-Tuttle creates the beloved Perseids, radiating from Perseus after midnight.", endDate: new Date(2029, 7, 13) },
  { name: "Draconids Meteor Shower", date: new Date(2029, 9, 7), type: "meteor-shower", description: "Evening shower from Comet Giacobini-Zinner, best viewed toward Draco.", endDate: new Date(2029, 9, 7) },
  { name: "Orionids Meteor Shower", date: new Date(2029, 9, 21), type: "meteor-shower", description: "Halley's Comet debris creates fast meteors from Orion after midnight.", endDate: new Date(2029, 9, 22) },
  { name: "Taurids Meteor Shower", date: new Date(2029, 10, 4), type: "meteor-shower", description: "Slow sporadic fireballs from Comet Encke radiating from Taurus.", endDate: new Date(2029, 10, 5) },
  { name: "Leonids Meteor Shower", date: new Date(2029, 10, 17), type: "meteor-shower", description: "Comet Tempel-Tuttle meteors from Leo; can produce brief intense bursts.", endDate: new Date(2029, 10, 18) },
  { name: "Geminids Meteor Shower", date: new Date(2029, 11, 13), type: "meteor-shower", description: "Asteroid Phaethon debris; multicolored meteors from Gemini all night.", endDate: new Date(2029, 11, 14) },
  { name: "Ursids Meteor Shower", date: new Date(2029, 11, 21), type: "meteor-shower", description: "Modest winter shower from Comet Tuttle near the December solstice.", endDate: new Date(2029, 11, 22) },
  // Planet oppositions
  { name: "Mars at Opposition", date: new Date(2029, 2, 25), type: "planet-event", description: "Mars at its closest and brightest of 2029 — rises at sunset and is visible all night long." },
  { name: "Jupiter at Opposition", date: new Date(2029, 3, 11), type: "planet-event", description: "Jupiter at its nearest to Earth for 2029 — ideal for observing cloud bands and the Galilean moons." },
  { name: "Saturn at Opposition", date: new Date(2029, 10, 13), type: "planet-event", description: "Saturn at opposition, shining bright with rings visible in a small telescope." },
  { name: "Neptune at Opposition", date: new Date(2029, 9, 2), type: "planet-event", description: "Neptune at its nearest for 2029 — visible as a faint blue-green point through a telescope." },
  { name: "Uranus at Opposition", date: new Date(2029, 11, 8), type: "planet-event", description: "Uranus at opposition, at its brightest — binoculars reveal its blue-green tint." },
  // Planet elongations
  { name: "Mercury at Greatest Western Elongation", date: new Date(2029, 1, 9), type: "planet-event", description: "Mercury at maximum morning elongation — look east before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2029, 3, 21), type: "planet-event", description: "Mercury at greatest evening elongation — visible in the western twilight." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2029, 5, 8), type: "planet-event", description: "Mercury at maximum morning elongation — visible in the east before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2029, 7, 19), type: "planet-event", description: "Mercury at greatest evening elongation — look for it low in the west after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2029, 8, 30), type: "planet-event", description: "Mercury at maximum morning elongation — visible in the eastern pre-dawn sky." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2029, 11, 14), type: "planet-event", description: "Mercury ends 2029 at greatest evening elongation — visible in the western twilight." },
  { name: "Venus at Greatest Eastern Elongation", date: new Date(2029, 9, 27), type: "planet-event", description: "Venus blazes as an evening star at its greatest angular distance east of the Sun." },
  // Solstices & Equinoxes
  { name: "March Equinox", date: new Date(2029, 2, 20), type: "equinox", description: "The spring equinox — day and night are equal in length. The Sun crosses the celestial equator moving northward." },
  { name: "June Solstice", date: new Date(2029, 5, 21), type: "solstice", description: "The summer solstice — the longest day of the year in the Northern Hemisphere. The Sun reaches its northernmost point." },
  { name: "September Equinox", date: new Date(2029, 8, 22), type: "equinox", description: "The autumn equinox — day and night are equal in length. The Sun crosses the celestial equator moving southward." },
  { name: "December Solstice", date: new Date(2029, 11, 21), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
  // ── 2030 ────────────────────────────────────────────────────────────────────
  // Meteor showers
  { name: "Quadrantids Meteor Shower", date: new Date(2030, 0, 3), type: "meteor-shower", description: "One of the year's strongest showers, peaking from Boötes before dawn.", endDate: new Date(2030, 0, 4) },
  { name: "Lyrids Meteor Shower", date: new Date(2030, 3, 22), type: "meteor-shower", description: "Annual shower from Comet Thatcher, radiating from Lyra after midnight.", endDate: new Date(2030, 3, 23) },
  { name: "Eta Aquarids Meteor Shower", date: new Date(2030, 4, 6), type: "meteor-shower", description: "Halley's Comet debris; swift pre-dawn meteors from Aquarius.", endDate: new Date(2030, 4, 7) },
  { name: "Delta Aquarids Meteor Shower", date: new Date(2030, 6, 28), type: "meteor-shower", description: "Steady summer shower from southern Aquarius, best after midnight.", endDate: new Date(2030, 6, 29) },
  { name: "Perseids Meteor Shower", date: new Date(2030, 7, 12), type: "meteor-shower", description: "The beloved annual shower from Comet Swift-Tuttle, radiating from Perseus.", endDate: new Date(2030, 7, 13) },
  { name: "Draconids Meteor Shower", date: new Date(2030, 9, 7), type: "meteor-shower", description: "Evening shower toward Draco from Comet Giacobini-Zinner.", endDate: new Date(2030, 9, 7) },
  { name: "Orionids Meteor Shower", date: new Date(2030, 9, 21), type: "meteor-shower", description: "Halley's Comet debris radiates from Orion; fast bright meteors after midnight.", endDate: new Date(2030, 9, 22) },
  { name: "Taurids Meteor Shower", date: new Date(2030, 10, 4), type: "meteor-shower", description: "Slow sporadic fireballs from Comet Encke in Taurus.", endDate: new Date(2030, 10, 5) },
  { name: "Leonids Meteor Shower", date: new Date(2030, 10, 17), type: "meteor-shower", description: "Comet Tempel-Tuttle meteors from Leo; potential for brief outbursts.", endDate: new Date(2030, 10, 18) },
  { name: "Geminids Meteor Shower", date: new Date(2030, 11, 13), type: "meteor-shower", description: "Asteroid Phaethon debris; multicolored meteors from Gemini throughout the night.", endDate: new Date(2030, 11, 14) },
  { name: "Ursids Meteor Shower", date: new Date(2030, 11, 21), type: "meteor-shower", description: "Modest winter shower from Comet Tuttle near the December solstice.", endDate: new Date(2030, 11, 22) },
  // Planet oppositions
  { name: "Jupiter at Opposition", date: new Date(2030, 4, 13), type: "planet-event", description: "Jupiter at closest approach for 2030 — the best night to view the giant planet and its moons." },
  { name: "Saturn at Opposition", date: new Date(2030, 10, 27), type: "planet-event", description: "Saturn at opposition; its rings are well-placed for viewing through a small telescope." },
  { name: "Neptune at Opposition", date: new Date(2030, 9, 5), type: "planet-event", description: "Neptune at its nearest to Earth for 2030 — visible as a faint blue disc through a telescope." },
  { name: "Uranus at Opposition", date: new Date(2030, 11, 12), type: "planet-event", description: "Uranus at opposition, rising at sunset and shining at its annual best." },
  // Planet elongations
  { name: "Mercury at Greatest Western Elongation", date: new Date(2030, 0, 22), type: "planet-event", description: "Mercury at maximum morning elongation — visible in the east before sunrise." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2030, 3, 4), type: "planet-event", description: "Mercury at greatest evening elongation — look west at dusk." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2030, 4, 21), type: "planet-event", description: "Mercury at maximum morning elongation — visible before sunrise in the east." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2030, 7, 2), type: "planet-event", description: "Mercury at greatest evening elongation — visible in the western sky after sunset." },
  { name: "Mercury at Greatest Western Elongation", date: new Date(2030, 8, 15), type: "planet-event", description: "Mercury at maximum morning elongation — look east before the Sun rises." },
  { name: "Mercury at Greatest Eastern Elongation", date: new Date(2030, 10, 26), type: "planet-event", description: "Mercury at greatest evening elongation — visible low in the western twilight." },
  { name: "Venus at Greatest Western Elongation", date: new Date(2030, 2, 17), type: "planet-event", description: "Venus shines brilliantly as a morning star at maximum angular distance west of the Sun." },
  // Solstices & Equinoxes
  { name: "March Equinox", date: new Date(2030, 2, 20), type: "equinox", description: "The spring equinox — day and night are equal in length. The Sun crosses the celestial equator moving northward." },
  { name: "June Solstice", date: new Date(2030, 5, 21), type: "solstice", description: "The summer solstice — the longest day of the year in the Northern Hemisphere. The Sun reaches its northernmost point." },
  { name: "September Equinox", date: new Date(2030, 8, 22), type: "equinox", description: "The autumn equinox — day and night are equal in length. The Sun crosses the celestial equator moving southward." },
  { name: "December Solstice", date: new Date(2030, 11, 21), type: "solstice", description: "The winter solstice — the shortest day of the year in the Northern Hemisphere. The Sun reaches its southernmost point." },
];

export function getAstroEventForDate(date: Date): AstronomicalEvent | null {
  return ASTRO_EVENTS.find((e) => isSameDay(e.date, date)) ?? null;
}

// ─── Odu of Ifa ─────────────────────────────────────────────────────────────

export interface OduEntry {
  index: number;
  name: string;
  yoruba: string;
  energy: string[];
  orisha: string;
  element: string;
  guidance: string;
  symbol: string;
}

export const ODU_LIST: OduEntry[] = [
  {
    index: 1,
    name: "Eji Ogbe",
    yoruba: "Ogbe Meji",
    energy: ["Clarity", "New Beginnings", "Divine Light"],
    orisha: "Obatala",
    element: "Light",
    guidance: "The way ahead is illuminated. Walk boldly in alignment with your highest self — Ifa opens every door before you today.",
    symbol: "I I I I",
  },
  {
    index: 2,
    name: "Oyeku Meji",
    yoruba: "Oyeku Meji",
    energy: ["Endings", "Rebirth", "The Sacred Void"],
    orisha: "Yemoja",
    element: "Darkness",
    guidance: "Something must end so something greater may be born. Honor what you release today — death is the womb of new creation.",
    symbol: "II II II II",
  },
  {
    index: 3,
    name: "Iwori Meji",
    yoruba: "Iwori Meji",
    energy: ["Inner Sight", "Intuition", "Self-Knowledge"],
    orisha: "Orunmila",
    element: "Spirit",
    guidance: "Turn your gaze inward. The answers you seek already live within your Ori — quiet the noise and listen to the wisdom inside.",
    symbol: "I II I II",
  },
  {
    index: 4,
    name: "Odi Meji",
    yoruba: "Odi Meji",
    energy: ["Mystery", "The Womb", "Hidden Depths"],
    orisha: "Osun",
    element: "Water",
    guidance: "Not all truths are visible to the eye. Trust the hidden processes unfolding beneath the surface — fertile ground is quiet ground.",
    symbol: "II I II I",
  },
  {
    index: 5,
    name: "Irosun Meji",
    yoruba: "Irosun Meji",
    energy: ["Vital Power", "Sacrifice", "Ashe"],
    orisha: "Shango",
    element: "Blood & Fire",
    guidance: "Your life force is your currency. Give where it returns tenfold, guard it from where it drains. Your ashe is sacred — use it with intention.",
    symbol: "I I II II",
  },
  {
    index: 6,
    name: "Owonrin Meji",
    yoruba: "Owonrin Meji",
    energy: ["Change", "Chaos", "Unexpected Grace"],
    orisha: "Eshu-Elegba",
    element: "Lightning",
    guidance: "Disruption arrives wearing the face of blessing. Do not resist what seems chaotic today — Elegba is rerouting your path toward fortune.",
    symbol: "II II I I",
  },
  {
    index: 7,
    name: "Obara Meji",
    yoruba: "Obara Meji",
    energy: ["Royalty", "Courage", "Generosity"],
    orisha: "Shango",
    element: "Thunder",
    guidance: "Carry yourself as the sovereign you are. Lead with an open hand — the king who gives freely is the king whose abundance never runs dry.",
    symbol: "I II I I",
  },
  {
    index: 8,
    name: "Okanran Meji",
    yoruba: "Okanran Meji",
    energy: ["Conflict", "Transformation", "Iron Will"],
    orisha: "Ogun",
    element: "Iron",
    guidance: "The forge demands heat. Face the friction before you with a steady heart — what is being tested is also being strengthened.",
    symbol: "II I II II",
  },
  {
    index: 9,
    name: "Ogunda Meji",
    yoruba: "Ogunda Meji",
    energy: ["Clearing Paths", "Justice", "Determination"],
    orisha: "Ogun",
    element: "Iron & Earth",
    guidance: "Take up your machete and move. Obstacles are no match for focused will — Ogun clears the brush so your destiny can walk forward.",
    symbol: "I I I II",
  },
  {
    index: 10,
    name: "Osa Meji",
    yoruba: "Osa Meji",
    energy: ["Protection", "Cunning", "Sudden Shifts"],
    orisha: "Oshosi",
    element: "Wind",
    guidance: "Wisdom wears the mask of strategy. Stay alert, trust your instincts, and do not underestimate what is watching over you today.",
    symbol: "II I I II",
  },
  {
    index: 11,
    name: "Ika Meji",
    yoruba: "Ika Meji",
    energy: ["Destiny", "Integrity", "Alignment"],
    orisha: "Obatala",
    element: "White Light",
    guidance: "Your character is your destiny. Walk today in full integrity — every action that aligns with your highest values writes your sacred story.",
    symbol: "I II II I",
  },
  {
    index: 12,
    name: "Oturupon Meji",
    yoruba: "Oturupon Meji",
    energy: ["Sacrifice", "Reversal", "Spiritual Battle"],
    orisha: "Elegba",
    element: "Crossroads",
    guidance: "What appears to be loss may be liberation. Offer up what binds you — a willing sacrifice made with faith unlocks doors invisible to the eye.",
    symbol: "II II I II",
  },
  {
    index: 13,
    name: "Otura Meji",
    yoruba: "Otura Meji",
    energy: ["Relationships", "Contracts", "Cosmic Order"],
    orisha: "Orunmila",
    element: "Spirit",
    guidance: "Honor every bond you've made — spiritual and earthly. Your web of relationships is sacred geometry. Tend your connections with reverence today.",
    symbol: "I I II I",
  },
  {
    index: 14,
    name: "Irete Meji",
    yoruba: "Irete Meji",
    energy: ["Patience", "Longevity", "Ancestral Wisdom"],
    orisha: "Oya",
    element: "Earth & Wind",
    guidance: "The elders counsel patience. The great tree does not rush its growth. Settle into the long view — your ancestors planted so you could harvest.",
    symbol: "II I I I",
  },
  {
    index: 15,
    name: "Ose Meji",
    yoruba: "Ose Meji",
    energy: ["Prosperity", "Fertility", "Sweet Life"],
    orisha: "Osun",
    element: "Honey & Water",
    guidance: "Open your hands and receive. Osun's river flows toward you carrying abundance — do not block the current with doubt or unworthiness.",
    symbol: "I II II II",
  },
  {
    index: 16,
    name: "Ofun Meji",
    yoruba: "Ofun Meji",
    energy: ["Completion", "Divine Law", "Full Circle"],
    orisha: "Orunmila",
    element: "Cosmic Fire",
    guidance: "You stand at the point of completion. Give thanks for the full cycle — every ending encoded with the seed of what comes next. Ase.",
    symbol: "II II II I",
  },
];

export function getDailyOdu(date: Date): OduEntry {
  // Use day-of-year to cycle deterministically through all 16 Odu
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / MS_PER_DAY) + 1;
  return ODU_LIST[(dayOfYear - 1) % 16];
}

export const ODU_REFLECTIONS: Record<string, string> = {
  "Eji Ogbe":     "Where in your life are you being called to begin again with full clarity and trust?",
  "Oyeku Meji":   "What must end today so something greater can be born? What are you being invited to release?",
  "Iwori Meji":   "What truth is your inner voice whispering that you have not yet fully heeded?",
  "Odi Meji":     "What is quietly forming beneath the surface of your life right now that you cannot yet see?",
  "Irosun Meji":  "Where are you pouring your vital energy, and is it returning to you tenfold?",
  "Owonrin Meji": "Where is the unexpected showing up in your life, and what blessing might it be carrying?",
  "Obara Meji":   "How can you lead with greater generosity today — in thought, word, or action?",
  "Okanran Meji": "What challenge are you being tempered by, and what strength is it forging in you?",
  "Ogunda Meji":  "What path needs clearing? What one decisive action would move you forward today?",
  "Osa Meji":     "Where do you need to trust your instincts right now, even without full certainty?",
  "Ika Meji":     "Where in your life might your actions be out of alignment with your deepest values?",
  "Oturupon Meji":"What are you willing to release or sacrifice to receive the blessing waiting on the other side?",
  "Otura Meji":   "Which relationship or commitment in your life most needs your intentional care today?",
  "Irete Meji":   "Where are you rushing something that needs the long, patient view of your ancestors?",
  "Ose Meji":     "What are you refusing to receive? Where are you blocking the flow of abundance into your life?",
  "Ofun Meji":    "What cycle in your life is completing? What would it look like to give thanks for the whole arc?",
};

export function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Ose Calendar (Yoruba 4-day sacred week) ────────────────────────────────
// Source: ashesoul.com/osecalendar — Anchor: April 26, 2026 = Day 0 (Obatala)

export interface OseGroup {
  id: string;
  dayIndex: number;
  name: string;
  orisas: string[];
  shortOrisas: string;
  description: string;
  guidance: string;
  offerings: string;
  color: string;
}

export const OSE_GROUPS: OseGroup[] = [
  {
    id: "obatala",
    dayIndex: 0,
    name: "Ose Obatala",
    orisas: ["Obatala", "Egungun", "Iyaami", "Sanpanna"],
    shortOrisas: "Obatala · Egungun · Iyaami · Sanpanna",
    description:
      "Day of Obatala — purity, wisdom, and creation. Day to honor the Egungun ancestor masquerades, the Iyaami elder powers, and Sanpanna's transformative earth mysteries.",
    guidance:
      "Wear white or light colors today. Speak with care and clarity. Offer cool water and white foods. A day for purification, prayer, and ancestral reverence.",
    offerings: "White foods, shea butter, cool water, white cloth",
    color: "#E8D5A0",
  },
  {
    id: "ifa",
    dayIndex: 1,
    name: "Ose Ifa",
    orisas: ["Ifa / Orunmila", "Esu", "Osun", "Yemoja", "Olokun"],
    shortOrisas: "Ifa / Orunmila · Esu · Osun · Yemoja · Olokun",
    description:
      "Day of Ifa — wisdom, divination, and the crossroads. Day of Esu's sacred messages, Osun's sweet waters, and the deep ocean mysteries of Yemoja and Olokun.",
    guidance:
      "A powerful day for divination, study, and spiritual inquiry. Leave offerings at crossroads. Honey, palm oil, and fresh water honor this sacred group.",
    offerings: "Palm nuts, palm oil, honey, kola nuts, fresh water, fish",
    color: "#D4A843",
  },
  {
    id: "ogun",
    dayIndex: 2,
    name: "Ose Ogun",
    orisas: ["Ogun", "Egbe", "Osoosi", "Orisa Oko"],
    shortOrisas: "Ogun · Egbe · Osoosi · Orisa Oko",
    description:
      "Day of Ogun — iron, labor, and the hunt. Day to honor Egbe (your celestial companions), Osoosi's forest wisdom, and Orisa Oko's harvest abundance.",
    guidance:
      "Engage in focused work and clear action today. Honor your Egbe with prayer. Palm oil and iron tools are sacred — clear obstacles and forge your path.",
    offerings: "Palm oil, kola nuts, iron implements, green herbs, yam",
    color: "#94A3B8",
  },
  {
    id: "sango",
    dayIndex: 3,
    name: "Ose Sango",
    orisas: ["Sango", "Oya", "Jakuta", "Aganju"],
    shortOrisas: "Sango · Oya · Jakuta · Aganju",
    description:
      "Day of Sango — thunder, justice, and royal power. Day of Oya's transformative winds, Jakuta's lightning truth, and Aganju's volcanic wilderness energy.",
    guidance:
      "Stand in your power and speak truth boldly. Release what no longer serves — Oya will carry it away. Red and white are the sacred colors of this day.",
    offerings: "Okra stew, bitter kola, plantains, red palm oil, red and white cloth",
    color: "#EF4444",
  },
];

const OSE_ANCHOR_MS = new Date(2026, 3, 26).getTime(); // April 26, 2026 = Day 0

export function getOseDay(date: Date): OseGroup {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  const diffDays = Math.round((noon.getTime() - OSE_ANCHOR_MS) / MS_PER_DAY);
  const idx = ((diffDays % 4) + 4) % 4;
  return OSE_GROUPS[idx];
}
