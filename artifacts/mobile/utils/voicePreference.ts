import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@mystical_voice_preference_v1";

export async function getVoicePreference(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setVoicePreference(identifier: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, identifier);
  } catch {
    // silently ignore storage errors
  }
}

export async function clearVoicePreference(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // silently ignore
  }
}
