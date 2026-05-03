import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@mystical_lunar_intentions";

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function saveIntention(
  newMoonDate: Date,
  text: string
): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const store: Record<string, string> = raw ? JSON.parse(raw) : {};
  store[dateKey(newMoonDate)] = text.trim();
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

export async function loadIntention(
  newMoonDate: Date
): Promise<string | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const store: Record<string, string> = JSON.parse(raw);
  return store[dateKey(newMoonDate)] ?? null;
}

export async function loadAllIntentions(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function deleteIntention(newMoonDate: Date): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return;
  const store: Record<string, string> = JSON.parse(raw);
  delete store[dateKey(newMoonDate)];
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}
