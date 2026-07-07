import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Share, Platform } from "react-native";

const BACKUP_VERSION = 1;
const BACKUP_FILENAME = "mystical-runnings-backup.json";

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

async function buildBackupData(): Promise<BackupData> {
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

const LAST_MANUAL_EXPORT_KEY = "@mystical_last_manual_export_ts";
const AUTO_BACKUP_FREQ_KEY = "@mystical_auto_backup_frequency";
const AUTO_BACKUP_DEST_KEY = "@mystical_auto_backup_destination";
const LAST_AUTO_BACKUP_KEY = "@mystical_last_auto_backup_ts";

export async function getLastBackupDate(): Promise<Date | null> {
  try {
    if (Platform.OS !== "web") {
      const { File, Paths } = await import("expo-file-system");
      const file = new File(Paths.document, BACKUP_FILENAME);
      if (file.exists) {
        const json = await file.text();
        const parsed = JSON.parse(json) as BackupData;
        return new Date(parsed.exportedAt);
      }
    }
    const raw = await AsyncStorage.getItem(LAST_MANUAL_EXPORT_KEY);
    return raw ? new Date(parseInt(raw, 10)) : null;
  } catch {
    return null;
  }
}

export async function getLastAutoBackupDate(): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_AUTO_BACKUP_KEY);
    return raw ? new Date(parseInt(raw, 10)) : null;
  } catch {
    return null;
  }
}

export type BackupDestination = "local" | "cloud";

/**
 * Manual export.
 * local  → saves file to device only (Downloads on web, Documents on native)
 * cloud  → saves file then opens the share sheet so user can pick iCloud Drive / Google Drive / etc.
 */
export async function exportBackup(destination: BackupDestination = "local"): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });

    // Cloud on web: use the native Web Share API (supported in Chrome on Android/iOS)
    // This opens the system share sheet so the user can pick Google Drive, email, etc.
    if (destination === "cloud" && typeof navigator !== "undefined" && "share" in navigator) {
      const WebFile = globalThis.File as new (parts: BlobPart[], name: string, opts?: FilePropertyBag) => globalThis.File;
      const shareFile = new WebFile([blob], BACKUP_FILENAME, { type: "application/json" });
      const nav = navigator as Navigator & {
        canShare?: (d: object) => boolean;
        share: (d: object) => Promise<void>;
      };
      const canShare = nav.canShare ? nav.canShare({ files: [shareFile] }) : true;
      if (canShare) {
        await nav.share({
          files: [shareFile],
          title: "Mystical Runnings Backup",
          text: "My Mystical Runnings backup file",
        });
        await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());
        return;
      }
    }

    // Local on web (or Cloud fallback if share API unavailable): browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = BACKUP_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());
    return;
  }

  const { File, Paths } = await import("expo-file-system");
  const file = new File(Paths.document, BACKUP_FILENAME);
  file.write(json);
  await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());

  if (destination === "cloud") {
    if (Platform.OS === "ios") {
      await Share.share({ url: file.uri, title: BACKUP_FILENAME });
    } else {
      await Share.share({ message: json, title: BACKUP_FILENAME });
    }
  }
}

export async function importBackupFromFile(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) return;

  const asset = result.assets[0];

  let json: string;
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    json = await response.text();
  } else {
    const { File } = await import("expo-file-system");
    const pickedFile = new File(asset.uri);
    json = await pickedFile.text();
  }

  await restoreFromJson(json);
}

async function restoreFromJson(json: string): Promise<void> {
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
    throw new Error("Invalid file — not a Mystical Runnings backup.");
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

/** "off" means auto-backup is disabled. Manual export via the Export button is always available. */
export type AutoBackupFrequency = "off" | "daily" | "weekly";

export async function getAutoBackupFrequency(): Promise<AutoBackupFrequency> {
  try {
    const raw = await AsyncStorage.getItem(AUTO_BACKUP_FREQ_KEY);
    if (raw === "daily" || raw === "weekly") return raw;
    return "off";
  } catch {
    return "off";
  }
}

export async function setAutoBackupFrequency(freq: AutoBackupFrequency): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_FREQ_KEY, freq);
}

export async function getAutoBackupDestination(): Promise<BackupDestination> {
  try {
    const raw = await AsyncStorage.getItem(AUTO_BACKUP_DEST_KEY);
    if (raw === "cloud") return "cloud";
    return "local";
  } catch {
    return "local";
  }
}

export async function setAutoBackupDestination(dest: BackupDestination): Promise<void> {
  await AsyncStorage.setItem(AUTO_BACKUP_DEST_KEY, dest);
}

/**
 * Silent auto-backup. Always saves to the Documents folder.
 * "cloud" destination on iOS: Documents auto-syncs to iCloud Drive if the user has it enabled.
 * "cloud" destination on Android: saves locally (silent Google Drive upload is not possible without
 *  user interaction; use the Export button → Cloud to send to Google Drive manually).
 */
async function exportBackupSilent(): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);
  if (Platform.OS !== "web") {
    const { File, Paths } = await import("expo-file-system");
    const file = new File(Paths.document, BACKUP_FILENAME);
    file.write(json);
  }
  await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, Date.now().toString());
}

export async function runAutoBackupIfDue(): Promise<void> {
  try {
    const freq = await getAutoBackupFrequency();
    if (freq === "off") return;
    const lastRaw = await AsyncStorage.getItem(LAST_AUTO_BACKUP_KEY);
    const now = Date.now();
    if (lastRaw) {
      const last = parseInt(lastRaw, 10);
      const msAgo = now - last;
      if (freq === "daily" && msAgo < 23 * 3600 * 1000) return;
      if (freq === "weekly" && msAgo < 6 * 24 * 3600 * 1000) return;
    }
    await exportBackupSilent();
  } catch {
    // silent — auto-backup failures must never crash the app
  }
}
