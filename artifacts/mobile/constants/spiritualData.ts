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
  | "ose-day";

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
};

const KNOWN_NEW_MOON_MS = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
const LUNAR_CYCLE_DAYS = 29.53058867;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function moonAge(date: Date): number {
  const noon = new Date(date);
  noon.setUTCHours(12, 0, 0, 0);
  const diff = (noon.getTime() - KNOWN_NEW_MOON_MS) / MS_PER_DAY;
  return ((diff % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
}

// Angular distance from a phase age to a quarter-point, handling the New Moon wrap.
function distToQ(age: number, q: number): number {
  if (q === 0) return Math.min(age, LUNAR_CYCLE_DAYS - age);
  return Math.abs(age - q);
}

export function getMoonPhaseData(date: Date): MoonPhaseData {
  const Q1 = LUNAR_CYCLE_DAYS / 4;       // ≈  7.38
  const Q2 = LUNAR_CYCLE_DAYS / 2;       // ≈ 14.77
  const Q3 = (3 * LUNAR_CYCLE_DAYS) / 4; // ≈ 22.15

  const phase = moonAge(date);

  const dPrev = new Date(date); dPrev.setDate(dPrev.getDate() - 1);
  const dNext = new Date(date); dNext.setDate(dNext.getDate() + 1);
  const prev = moonAge(dPrev);
  const next = moonAge(dNext);

  const phaseFraction = phase / LUNAR_CYCLE_DAYS;
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * phaseFraction)));

  // A major phase fires on the one day whose noon is closest to the true astronomical event.
  // Comparing against both neighbours guarantees exactly one day fires per quarter phase.
  const closest = (q: number) =>
    distToQ(phase, q) < distToQ(prev, q) && distToQ(phase, q) <= distToQ(next, q);

  let name: string;
  let isMajorPhase = false;
  let eventType: EventType;

  if (closest(0)) {
    name = "New Moon";      isMajorPhase = true; eventType = "new-moon";
  } else if (closest(Q1)) {
    name = "First Quarter"; isMajorPhase = true; eventType = "first-quarter";
  } else if (closest(Q2)) {
    name = "Full Moon";     isMajorPhase = true; eventType = "full-moon";
  } else if (closest(Q3)) {
    name = "Last Quarter";  isMajorPhase = true; eventType = "last-quarter";
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

// 2026 Wheel of the Year — Sabbats (source: Patheos / Heron Michelle)
export const SABBATS: WheelEvent[] = [
  {
    name: "Yule — Winter Solstice",
    date: new Date(2025, 11, 21),
    type: "sabbat",
    description: "Sun enters Capricorn at 10:03 AM ET. The longest night of the year — light a candle and honor the return of the sun.",
  },
  {
    name: "Imbolc — High Winter",
    date: new Date(2026, 1, 3),
    type: "sabbat",
    description: "Sun at 15° Aquarius. Festival of the returning light — honor Brigid, cleanse and set intentions for the year ahead.",
  },
  {
    name: "Ostara — Spring Equinox",
    date: new Date(2026, 2, 20),
    type: "sabbat",
    description: "Sun enters Aries at 10:46 AM ET. Balance of light and dark — seeds planted now carry the force of the equinox.",
  },
  {
    name: "Beltane — High Spring",
    date: new Date(2026, 4, 5),
    type: "sabbat",
    description: "Sun at 15° Taurus. Festival of fire and fertility — the peak of spring's creative power.",
  },
  {
    name: "Litha — Summer Solstice",
    date: new Date(2026, 5, 21),
    type: "sabbat",
    description: "Sun enters Cancer at 4:24 AM ET. The longest day of the year — celebrate the sun at its fullest strength.",
  },
  {
    name: "Lammas — High Summer",
    date: new Date(2026, 7, 7),
    type: "sabbat",
    description: "Sun at 15° Leo. First harvest festival — give thanks for abundance, begin the slow turn toward autumn.",
  },
  {
    name: "Mabon — Autumn Equinox",
    date: new Date(2026, 8, 22),
    type: "sabbat",
    description: "Sun enters Libra at 8:05 PM ET. Second harvest — balance returns, honor gratitude and release.",
  },
  {
    name: "Samhain — High Autumn",
    date: new Date(2026, 10, 7),
    type: "sabbat",
    description: "Sun at 15° Scorpio. The veil between worlds is thinnest — honor the dead, your ancestors, and the cycle of endings.",
  },
  {
    name: "Yule — Winter Solstice",
    date: new Date(2026, 11, 21),
    type: "sabbat",
    description: "Sun enters Capricorn at 3:50 PM ET. The wheel completes — welcome the return of the light once more.",
  },
];

// 2026 Named Full Moons (source: Patheos / Heron Michelle)
export const NAMED_FULL_MOONS: WheelEvent[] = [
  { name: "Cold Full Moon", date: new Date(2026, 0, 3), type: "named-moon", description: "Full Moon in Cancer", sign: "Cancer" },
  { name: "Quickening Full Moon", date: new Date(2026, 1, 1), type: "named-moon", description: "Full Moon in Leo", sign: "Leo" },
  { name: "Storm Full Moon", date: new Date(2026, 2, 3), type: "named-moon", description: "Full Moon in Virgo — Lunar Eclipse", sign: "Virgo" },
  { name: "Wind Full Moon", date: new Date(2026, 3, 1), type: "named-moon", description: "Full Moon in Libra", sign: "Libra" },
  { name: "Flower Full Moon", date: new Date(2026, 4, 1), type: "named-moon", description: "Full Moon in Scorpio", sign: "Scorpio" },
  { name: "Strong Sun Full Moon", date: new Date(2026, 4, 31), type: "named-moon", description: "Full Moon in Sagittarius", sign: "Sagittarius" },
  { name: "Blessing Full Moon", date: new Date(2026, 5, 29), type: "named-moon", description: "Full Moon in Capricorn", sign: "Capricorn" },
  { name: "Corn Full Moon", date: new Date(2026, 6, 29), type: "named-moon", description: "Full Moon in Aquarius", sign: "Aquarius" },
  { name: "Harvest Full Moon", date: new Date(2026, 7, 27), type: "named-moon", description: "Full Moon in Pisces — Lunar Eclipse", sign: "Pisces" },
  { name: "Blood Full Moon", date: new Date(2026, 8, 26), type: "named-moon", description: "Full Moon in Aries", sign: "Aries" },
  { name: "Mourning Full Moon", date: new Date(2026, 9, 25), type: "named-moon", description: "Full Moon in Taurus", sign: "Taurus" },
  { name: "Long Nights Full Moon", date: new Date(2026, 10, 24), type: "named-moon", description: "Full Moon in Gemini", sign: "Gemini" },
];

// 2026 Dark Moons (source: Patheos / Heron Michelle)
export const DARK_MOONS: WheelEvent[] = [
  { name: "Dark Moon", date: new Date(2026, 0, 18), type: "dark-moon", description: "Dark Moon in Capricorn", sign: "Capricorn" },
  { name: "Dark Moon", date: new Date(2026, 1, 17), type: "dark-moon", description: "Dark Moon in Aquarius — Solar Eclipse / Lunar New Year (Year of the Horse)", sign: "Aquarius" },
  { name: "Dark Moon", date: new Date(2026, 2, 18), type: "dark-moon", description: "Dark Moon in Pisces", sign: "Pisces" },
  { name: "Dark Moon", date: new Date(2026, 3, 17), type: "dark-moon", description: "Dark Moon in Aries", sign: "Aries" },
  { name: "Dark Moon", date: new Date(2026, 4, 16), type: "dark-moon", description: "Dark Moon in Taurus", sign: "Taurus" },
  { name: "Dark Moon", date: new Date(2026, 5, 14), type: "dark-moon", description: "Dark Moon in Gemini", sign: "Gemini" },
  { name: "Dark Moon", date: new Date(2026, 6, 13), type: "dark-moon", description: "Dark Moon in Cancer", sign: "Cancer" },
  { name: "Dark Moon", date: new Date(2026, 7, 12), type: "dark-moon", description: "Dark Moon in Leo — Solar Eclipse", sign: "Leo" },
  { name: "Dark Moon", date: new Date(2026, 8, 10), type: "dark-moon", description: "Dark Moon in Virgo", sign: "Virgo" },
  { name: "Dark Moon", date: new Date(2026, 9, 9), type: "dark-moon", description: "Dark Moon in Libra", sign: "Libra" },
  { name: "Dark Moon", date: new Date(2026, 10, 8), type: "dark-moon", description: "Dark Moon in Scorpio", sign: "Scorpio" },
  { name: "Dark Moon", date: new Date(2026, 11, 8), type: "dark-moon", description: "Dark Moon in Sagittarius", sign: "Sagittarius" },
];

// 2026 Eclipses (source: Patheos / Heron Michelle)
export const ECLIPSES: WheelEvent[] = [
  {
    name: "Solar Eclipse",
    date: new Date(2026, 1, 16),
    type: "solar-eclipse",
    description: "Solar Eclipse — Dark Moon in Aquarius. Powerful portal for new beginnings. Also Lunar New Year (Year of the Horse).",
    sign: "Aquarius",
  },
  {
    name: "Lunar Eclipse",
    date: new Date(2026, 2, 2),
    type: "lunar-eclipse",
    description: "Lunar Eclipse — Storm Full Moon in Virgo. Deep release and illumination of what must be healed.",
    sign: "Virgo",
  },
  {
    name: "Solar Eclipse",
    date: new Date(2026, 7, 11),
    type: "solar-eclipse",
    description: "Solar Eclipse — Dark Moon in Leo. A powerful reset at the height of summer — bold intentions carry extra force.",
    sign: "Leo",
  },
  {
    name: "Lunar Eclipse",
    date: new Date(2026, 7, 27),
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

  return events;
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
