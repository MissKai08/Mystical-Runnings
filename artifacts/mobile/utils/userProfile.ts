import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mystical_user_profile_v1";

export interface UserProfile {
  firstName: string;
  birthMonth?: number;
  birthDay?: number;
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.firstName === "string") {
      return {
        firstName: parsed.firstName,
        ...(typeof parsed.birthMonth === "number" && { birthMonth: parsed.birthMonth }),
        ...(typeof parsed.birthDay === "number" && { birthDay: parsed.birthDay }),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function isTodayBirthday(profile: UserProfile, today: Date): boolean {
  if (profile.birthMonth === undefined || profile.birthDay === undefined) return false;
  return (
    today.getMonth() + 1 === profile.birthMonth &&
    today.getDate() === profile.birthDay
  );
}
