import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Share, Platform } from "react-native";

// StorageAccessFramework is not reflected in the static types for this version of expo-file-system.
// We access it via a typed alias so the rest of the file can use it without repeated `any` casts.
interface SAFType {
  requestDirectoryPermissionsAsync(): Promise<{ granted: boolean; directoryUri: string }>;
  createFileAsync(folderUri: string, filename: string, mimeType: string): Promise<string>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StorageAccessFramework: SAFType = (FileSystem as any).StorageAccessFramework;

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
const LAST_AUTO_BACKUP_KEY = "@mystical_last_auto_backup_ts";
const BACKUP_FOLDER_URI_KEY = "@mystical_backup_folder_uri";

/** Generate a timestamped filename for every export */
function generateBackupFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `mystical-runnings-backup-${stamp}.json`;
}

/** (Android only) Request a folder via SAF and persist it */
export async function pickBackupFolder(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!result.granted) return null;
  await AsyncStorage.setItem(BACKUP_FOLDER_URI_KEY, result.directoryUri);
  return result.directoryUri;
}

/** (Android only) Return the previously picked folder URI, or null */
export async function getBackupFolderUri(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  return AsyncStorage.getItem(BACKUP_FOLDER_URI_KEY);
}

export async function getLastBackupDate(): Promise<Date | null> {
  try {
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
 * local  → saves file to device (SAF folder on Android if set, Documents otherwise)
 * cloud  → saves file then opens the share sheet so user can pick iCloud Drive / Google Drive / etc.
 */
export async function exportBackup(destination: BackupDestination = "local"): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);
  const filename = generateBackupFilename();

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });

    // Cloud on web: use the native Web Share API (supported in Chrome on Android/iOS)
    if (destination === "cloud" && typeof navigator !== "undefined" && "share" in navigator) {
      const WebFile = globalThis.File as new (parts: BlobPart[], name: string, opts?: FilePropertyBag) => globalThis.File;
      const shareFile = new WebFile([blob], filename, { type: "application/json" });
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
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());
    return;
  }

  // Native — Android: try SAF picked folder first for local
  if (Platform.OS === "android" && destination === "local") {
    const folderUri = await getBackupFolderUri();
    if (folderUri) {
      try {
        const fileUri = await StorageAccessFramework.createFileAsync(folderUri, filename, "application/json");
        await FileSystem.writeAsStringAsync(fileUri, json);
        await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());
        return;
      } catch {
        // Fall through to Documents fallback if SAF fails
      }
    }
  }

  // Native — write to Documents folder (iOS / Android fallback)
  const { File, Paths } = await import("expo-file-system");
  const file = new File(Paths.document, filename);
  file.write(json);
  await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());

  if (destination === "cloud") {
    if (Platform.OS === "ios") {
      await Share.share({ url: file.uri, title: filename });
    } else {
      await Share.share({ message: json, title: filename });
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

/**
 * Silent auto-backup. Writes to the SAF-picked folder on Android (if set),
 * otherwise Documents folder. Uses a timestamped filename.
 */
async function exportBackupSilent(): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);
  const filename = generateBackupFilename();

  if (Platform.OS !== "web") {
    if (Platform.OS === "android") {
      const folderUri = await getBackupFolderUri();
      if (folderUri) {
        try {
            const fileUri = await StorageAccessFramework.createFileAsync(folderUri, filename, "application/json");
          await FileSystem.writeAsStringAsync(fileUri, json);
          await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, Date.now().toString());
          return;
        } catch {
          // Fall through to Documents fallback
        }
      }
    }
    const { File, Paths } = await import("expo-file-system");
    const file = new File(Paths.document, filename);
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
