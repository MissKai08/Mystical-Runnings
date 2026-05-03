import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mystical_font_scale_v1";

const SCALE_STEPS = [0.82, 0.91, 1.0, 1.12, 1.26];
export const DEFAULT_SCALE_INDEX = 2;

export async function loadFontScaleIndex(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_SCALE_INDEX;
    const idx = parseInt(raw, 10);
    if (idx >= 0 && idx < SCALE_STEPS.length) return idx;
    return DEFAULT_SCALE_INDEX;
  } catch {
    return DEFAULT_SCALE_INDEX;
  }
}

export async function saveFontScaleIndex(idx: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(idx));
}

export function fontScaleFromIndex(idx: number): number {
  return SCALE_STEPS[Math.max(0, Math.min(SCALE_STEPS.length - 1, idx))] ?? 1.0;
}

export const MAX_SCALE_INDEX = SCALE_STEPS.length - 1;
