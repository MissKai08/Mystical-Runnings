import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SpecialCalendarEntry {
  id: string;
  title: string;
  date: string;
  category: string;
  note?: string;
}

export const SPECIAL_CALENDAR_KEY = "@mystical_special_calendar_entries";
export const SPECIAL_EVENT_COLOR = "#EC4899";

export async function loadSpecialCalendarEntries(): Promise<SpecialCalendarEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SPECIAL_CALENDAR_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpecialCalendarEntry[];
  } catch {
    return [];
  }
}

export async function saveSpecialCalendarEntries(entries: SpecialCalendarEntry[]): Promise<void> {
  await AsyncStorage.setItem(SPECIAL_CALENDAR_KEY, JSON.stringify(entries));
}

export function getSpecialEntriesForDate(
  entries: SpecialCalendarEntry[],
  date: Date
): SpecialCalendarEntry[] {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateStr = `${date.getFullYear()}-${mm}-${dd}`;
  return entries.filter((e) => e.date === dateStr);
}
