export type EventType =
  | "new-moon"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full-moon"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent"
  | "retrograde"
  | "ifa-prayer"
  | "ifa-festival";

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

export interface SpiritualEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  color: string;
  date: Date;
  endDate?: Date;
}

export const EVENT_COLORS = {
  moon: "#A78BFA",
  retrograde: "#F97316",
  ifaPrayer: "#D4A843",
  ifaFestival: "#22D3EE",
};

const KNOWN_NEW_MOON_MS = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
const LUNAR_CYCLE_DAYS = 29.53058867;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getMoonPhaseData(date: Date): MoonPhaseData {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  const daysDiff = (noon.getTime() - KNOWN_NEW_MOON_MS) / MS_PER_DAY;
  const phase = ((daysDiff % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
  const phaseFraction = phase / LUNAR_CYCLE_DAYS;

  let name: string;
  let illumination: number;
  let isMajorPhase = false;
  let eventType: EventType;

  if (phase < 1.85) {
    name = "New Moon"; illumination = 0; isMajorPhase = true; eventType = "new-moon";
  } else if (phase < 7.38) {
    name = "Waxing Crescent"; illumination = Math.round((phase / 7.38) * 45); eventType = "waxing-crescent";
  } else if (phase < 9.22) {
    name = "First Quarter"; illumination = 50; isMajorPhase = true; eventType = "first-quarter";
  } else if (phase < 14.77) {
    name = "Waxing Gibbous"; illumination = Math.round(50 + ((phase - 9.22) / 5.55) * 50); eventType = "waxing-gibbous";
  } else if (phase < 16.61) {
    name = "Full Moon"; illumination = 100; isMajorPhase = true; eventType = "full-moon";
  } else if (phase < 22.15) {
    name = "Waning Gibbous"; illumination = Math.round(100 - ((phase - 16.61) / 5.54) * 50); eventType = "waning-gibbous";
  } else if (phase < 23.99) {
    name = "Last Quarter"; illumination = 50; isMajorPhase = true; eventType = "last-quarter";
  } else {
    name = "Waning Crescent"; illumination = Math.round(Math.max(0, 50 - ((phase - 23.99) / 5.54) * 45)); eventType = "waning-crescent";
  }

  return { phase, phaseFraction, name, illumination, isMajorPhase, eventType };
}

export const MERCURY_RETROGRADES: RetrogradePeriod[] = [
  { start: new Date(2024, 3, 1), end: new Date(2024, 3, 25), label: "Mercury Retrograde in Aries" },
  { start: new Date(2024, 7, 5), end: new Date(2024, 7, 28), label: "Mercury Retrograde in Virgo/Leo" },
  { start: new Date(2024, 10, 26), end: new Date(2024, 11, 15), label: "Mercury Retrograde in Sagittarius" },
  { start: new Date(2025, 2, 15), end: new Date(2025, 3, 7), label: "Mercury Retrograde in Aries/Pisces" },
  { start: new Date(2025, 6, 18), end: new Date(2025, 7, 11), label: "Mercury Retrograde in Leo" },
  { start: new Date(2025, 10, 9), end: new Date(2025, 10, 29), label: "Mercury Retrograde in Sagittarius" },
  { start: new Date(2026, 1, 25), end: new Date(2026, 2, 20), label: "Mercury Retrograde in Pisces" },
  { start: new Date(2026, 5, 26), end: new Date(2026, 6, 18), label: "Mercury Retrograde in Cancer" },
  { start: new Date(2026, 9, 22), end: new Date(2026, 10, 11), label: "Mercury Retrograde in Scorpio" },
];

export const IFA_FESTIVALS: IfaFestival[] = [
  { name: "Ifa Festival", date: new Date(2025, 5, 7), description: "Annual celebration honoring Orunmila and the Ifa corpus" },
  { name: "Osun-Osogbo Festival", date: new Date(2025, 7, 8), description: "Sacred festival at the Osun Grove, UNESCO World Heritage site" },
  { name: "Olojo Festival", date: new Date(2025, 9, 3), description: "Festival honoring Ogun at Ile-Ife — the Ooni wears the sacred Aare crown" },
  { name: "Egungun Festival", date: new Date(2025, 5, 20), description: "Masquerade festival honoring and communing with ancestral spirits" },
  { name: "Ifa Festival", date: new Date(2026, 5, 6), description: "Annual celebration honoring Orunmila and the Ifa corpus" },
  { name: "Osun-Osogbo Festival", date: new Date(2026, 7, 14), description: "Sacred festival at the Osun Grove" },
  { name: "Olojo Festival", date: new Date(2026, 9, 16), description: "Festival honoring Ogun at Ile-Ife" },
  { name: "Egungun Festival", date: new Date(2026, 5, 19), description: "Masquerade festival honoring ancestral spirits" },
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
  d.setHours(12, 0, 0, 0);
  return MERCURY_RETROGRADES.find((r) => d >= r.start && d <= r.end) ?? null;
}

export function isIfaPrayerDay(date: Date): boolean {
  return date.getDay() === 4;
}

export function getIfaFestivalForDate(date: Date): IfaFestival | null {
  return IFA_FESTIVALS.find((f) => isSameDay(f.date, date)) ?? null;
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

  events.push({
    id: `moon-${date.toDateString()}`,
    type: moonData.eventType,
    name: moonData.name,
    description: `${moonData.illumination}% illuminated`,
    color: EVENT_COLORS.moon,
    date,
  });

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
      color: EVENT_COLORS.ifaPrayer,
      date,
    });
  }

  if (festival) {
    events.push({
      id: `ifa-festival-${date.toDateString()}`,
      type: "ifa-festival",
      name: festival.name,
      description: festival.description,
      color: EVENT_COLORS.ifaFestival,
      date,
    });
  }

  return events;
}

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
