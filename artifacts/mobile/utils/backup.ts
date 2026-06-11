import AsyncStorage from "@react-native-async-storage/async-storage";
import { Share, Alert } from "react-native";

const BACKUP_VERSION = 1;

const BACKUP_KEYS = [
  "@mystical_journal_entries",
  "@mystical_streak_freezes",
  "@mystical_shield_tokens",
  "@mystical_shield_grant_date",
  "@mystical_moon_water_blessings",
  "@mystical_sacred_intentions_v1",
  "@mystical_special_calendar_entries",
  "@mystical_altar_v1",
  "@mystical_user_profile_v1",
  "@mystical_font_scale_v1",
  "@mystical_notif_settings",
  "@mystical_lunar_intentions",
  "moonwater_ritual_logs",
];

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  data: Record<string, string | null>;
}

export async function buildBackupData(): Promise<BackupData> {
  const pairs = await AsyncStorage.multiGet(BACKUP_KEYS);
  const data: Record<string, string | null> = {};
  for (const [key, value] of pairs) {
    data[key] = value;
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "Mystical Runnings",
    data,
  };
}

export async function exportBackup(): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);
  await Share.share({
    message: json,
    title: "mystical-runnings-backup.json",
  });
}

export async function importBackupFromJson(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid backup — could not parse JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    !("data" in parsed) ||
    (parsed as BackupData).appName !== "Mystical Runnings"
  ) {
    throw new Error("Invalid backup file — not a Mystical Runnings backup.");
  }

  const backup = parsed as BackupData;
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(backup.data)) {
    if (value !== null && BACKUP_KEYS.includes(key)) {
      pairs.push([key, value]);
    }
  }

  if (pairs.length === 0) {
    throw new Error("Backup appears to be empty.");
  }

  await AsyncStorage.multiSet(pairs);
}

export function confirmRestore(onConfirm: () => void): void {
  Alert.alert(
    "Restore Backup",
    "This will overwrite your current data with the backup. This cannot be undone. Are you sure?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Restore", style: "destructive", onPress: onConfirm },
    ]
  );
}
