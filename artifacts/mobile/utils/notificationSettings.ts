import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@mystical_notif_settings";

export interface NotifTypeSettings {
  dailyBriefing: boolean;
  oduReflection: boolean;
  journalPrompt: boolean;
  namedMoons: boolean;
  darkMoons: boolean;
  majorPhases: boolean;
  sabbats: boolean;
  eclipses: boolean;
  mercuryRetrograde: boolean;
  ifaPrayerDays: boolean;
  ifaFestivals: boolean;
  oseTransitions: boolean;
  holidaysUs: boolean;
  holidaysMexico: boolean;
  holidaysIndia: boolean;
  holidaysJewish: boolean;
}

export interface NotificationSettings {
  masterEnabled: boolean;
  advanceDays: 1 | 2 | 3;
  types: NotifTypeSettings;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  masterEnabled: false,
  advanceDays: 1,
  types: {
    dailyBriefing: false,
    oduReflection: true,
    journalPrompt: false,
    namedMoons: true,
    darkMoons: true,
    majorPhases: true,
    sabbats: true,
    eclipses: true,
    mercuryRetrograde: true,
    ifaPrayerDays: false,
    ifaFestivals: true,
    oseTransitions: false,
    holidaysUs: true,
    holidaysMexico: true,
    holidaysIndia: true,
    holidaysJewish: true,
  },
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      types: { ...DEFAULT_SETTINGS.types, ...(saved.types ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
