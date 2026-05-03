import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RitualStep {
  id: string;
  label: string;
  category: string;
  tip?: string;
}

export interface RitualLog {
  id: string;
  /** "YYYY-MM-phase" — one log per phase per calendar month */
  cycleKey: string;
  phase: string;
  phaseName: string;
  completedSteps: string[];
  notes: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Ritual steps per phase ───────────────────────────────────────────────────

export const PHASE_RITUALS: Record<string, RitualStep[]> = {
  "dark-moon": [
    { id: "dm-1", label: "Clear and cleanse your ritual space",         category: "Prepare", tip: "Light incense, use sound bowls, or burn herbs to move stagnant energy." },
    { id: "dm-2", label: "Wash and consecrate your water vessel",       category: "Prepare", tip: "Soap and intention together — speak what you are clearing as you wash." },
    { id: "dm-3", label: "Sit in stillness and reflect on the closing cycle", category: "Reflect" },
    { id: "dm-4", label: "Write down what you are releasing",           category: "Release", tip: "Be specific. What belief, habit, or relationship needs to end?" },
    { id: "dm-5", label: "Rest — do not fill the vessel tonight",       category: "Honor",   tip: "The dark moon is a time of emptying, not filling. Honor the void." },
  ],
  "new-moon": [
    { id: "nm-1", label: "Cleanse your vessel with intention",          category: "Prepare" },
    { id: "nm-2", label: "Write your intention on paper",               category: "Intend",  tip: "Be specific and present-tense. 'I am...' not 'I want...'" },
    { id: "nm-3", label: "Place the paper beneath your vessel",         category: "Intend" },
    { id: "nm-4", label: "Fill the vessel with clean spring water",     category: "Fill" },
    { id: "nm-5", label: "Place outside or on a windowsill facing the moon", category: "Charge" },
    { id: "nm-6", label: "Speak your intention aloud over the water",   category: "Bless",   tip: "Your voice carries vibration — let it enter the water." },
    { id: "nm-7", label: "Leave overnight to absorb new moon energy",   category: "Charge" },
  ],
  "waxing-crescent": [
    { id: "wc-1", label: "Check on your water vessel",                  category: "Tend" },
    { id: "wc-2", label: "Add a crystal aligned with your intention",   category: "Amplify", tip: "Clear quartz amplifies. Rose quartz calls love. Citrine draws abundance." },
    { id: "wc-3", label: "Add a moon-blessed herb if desired",          category: "Amplify", tip: "Lavender for calm · Rosemary for clarity · Jasmine for love." },
    { id: "wc-4", label: "Spend 5 minutes visualizing your intention",  category: "Charge",  tip: "See it as already done. Feel the feeling." },
  ],
  "first-quarter": [
    { id: "fq-1", label: "Hold the vessel and feel the momentum building", category: "Charge" },
    { id: "fq-2", label: "Add a few drops of essential oil or flower essence", category: "Amplify" },
    { id: "fq-3", label: "Meditate with the water for 5–10 minutes",   category: "Charge" },
    { id: "fq-4", label: "Reaffirm your commitment to your intention aloud", category: "Bless" },
    { id: "fq-5", label: "Place the vessel in moonlight tonight",       category: "Charge" },
  ],
  "waxing-gibbous": [
    { id: "wg-1", label: "Refill the vessel with fresh water if needed", category: "Tend" },
    { id: "wg-2", label: "Hold the vessel and project your vision into it", category: "Charge", tip: "Feel the feeling of your desire already fulfilled. Breathe it in." },
    { id: "wg-3", label: "Add one final crystal or botanical touch",    category: "Amplify" },
    { id: "wg-4", label: "Leave outside for tonight's near-full moonlight", category: "Charge" },
  ],
  "full-moon": [
    { id: "fm-1", label: "Cleanse your space — smudge, sound, or sweep", category: "Prepare" },
    { id: "fm-2", label: "Fill your vessel with fresh clean water",     category: "Fill" },
    { id: "fm-3", label: "Arrange crystals in a circle around the vessel", category: "Prepare", tip: "Any crystals will absorb and amplify full moon energy overnight." },
    { id: "fm-4", label: "Write what you are grateful for this cycle",  category: "Gratitude" },
    { id: "fm-5", label: "Speak a blessing or prayer over the water",   category: "Bless" },
    { id: "fm-6", label: "Leave the vessel under direct moonlight all night", category: "Charge", tip: "Even through a window works if outdoors isn't possible." },
    { id: "fm-7", label: "Retrieve the vessel before noon",             category: "Harvest" },
    { id: "fm-8", label: "Cap, label with the date, and store your moon water", category: "Harvest" },
  ],
  "named-moon": [
    { id: "fnm-1", label: "Acknowledge the special name and power of this moon", category: "Honor" },
    { id: "fnm-2", label: "Cleanse your space with extra care tonight", category: "Prepare" },
    { id: "fnm-3", label: "Fill your vessel and set a sacred cycle intention", category: "Fill" },
    { id: "fnm-4", label: "Add a crystal and an herb for this moon's energy", category: "Amplify" },
    { id: "fnm-5", label: "Write a letter of gratitude to your ancestors", category: "Bless" },
    { id: "fnm-6", label: "Leave under moonlight all night",            category: "Charge" },
    { id: "fnm-7", label: "Retrieve and store in the morning",          category: "Harvest" },
  ],
  "waning-gibbous": [
    { id: "wng-1", label: "Give thanks — drink a sip of your moon water", category: "Use" },
    { id: "wng-2", label: "Write down what you are releasing this cycle", category: "Release" },
    { id: "wng-3", label: "Pour a small offering of water onto the earth", category: "Offer",  tip: "As you pour, speak aloud what you are releasing." },
    { id: "wng-4", label: "Use moon water to cleanse your altar or sacred objects", category: "Use" },
  ],
  "last-quarter": [
    { id: "lq-1", label: "Complete your releasing ritual",              category: "Release" },
    { id: "lq-2", label: "Use remaining moon water for a cleansing bath", category: "Use",    tip: "Add it to bath water or use it to wash your hands with intention." },
    { id: "lq-3", label: "Use moon water as a floor or space wash",     category: "Use" },
    { id: "lq-4", label: "Write down what you learned this cycle",      category: "Reflect" },
  ],
  "waning-crescent": [
    { id: "wnc-1", label: "Use the last of your moon water with gratitude", category: "Use" },
    { id: "wnc-2", label: "Clean and dry your vessel thoroughly",       category: "Prepare" },
    { id: "wnc-3", label: "Reflect on the full lunar cycle in your journal", category: "Reflect" },
    { id: "wnc-4", label: "Rest and prepare your spirit for the new cycle", category: "Honor" },
  ],
};

export function getStepsForPhase(eventType: string): RitualStep[] {
  return PHASE_RITUALS[eventType] ?? PHASE_RITUALS["full-moon"];
}

// ─── Cycle key ────────────────────────────────────────────────────────────────

export function makeCycleKey(phase: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-${phase}`;
}

// ─── Storage CRUD ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "moonwater_ritual_logs";

async function loadAll(): Promise<RitualLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RitualLog[]) : [];
  } catch {
    return [];
  }
}

async function saveAll(logs: RitualLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export async function getLogForCycle(cycleKey: string): Promise<RitualLog | null> {
  const all = await loadAll();
  return all.find((l) => l.cycleKey === cycleKey) ?? null;
}

export async function upsertLog(log: RitualLog): Promise<void> {
  const all = await loadAll();
  const idx = all.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    all[idx] = log;
  } else {
    all.unshift(log);
  }
  await saveAll(all);
}

export async function getAllLogs(): Promise<RitualLog[]> {
  const all = await loadAll();
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function newLog(phase: string, phaseName: string, cycleKey: string): RitualLog {
  const now = new Date().toISOString();
  return {
    id: `${cycleKey}-${Date.now()}`,
    cycleKey,
    phase,
    phaseName,
    completedSteps: [],
    notes: "",
    isComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}
