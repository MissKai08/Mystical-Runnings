Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: several items from earlier rounds are already confirmed working and are NOT included here — USNO sunrise/sunset/moonrise/moonset, notification permission on startup, splash screen sizing (`contain` + matching background, confirmed correct), today's `today` value in `index.tsx` (already correctly unmemoized), the modal scroll `flex:1` change itself is being reverted below but the sheets/maxHeight structure otherwise stays as-is. Do not touch any of that beyond what's listed.

---

## 1. Modal scroll regression — revert `flex: 1`, keep `flexShrink: 1` only

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`, `app/(tabs)/index.tsx` (Profile modal)

A previous patch added `flex: 1` alongside `flexShrink: 1` to fix long-content scrolling, but it caused a worse regression: `flex: 1` sets `flexBasis: 0%`, and inside these sheets (sized only by `maxHeight`, not a fixed `height`), that collapses the ScrollView toward zero height instead of sizing to its content — Profile modal now shows only Cancel/Save with no fields, and detail cards show only the title before jumping to Close. Revert this specific change in all three places — remove `flex: 1`, keep `flexShrink: 1`:

**`components/EventDetailModal.tsx`** — find:
```typescript
scrollArea: {
  flex: 1,
  flexShrink: 1,
},
```
Change to:
```typescript
scrollArea: {
  flexShrink: 1,
},
```

**`components/OseDetailModal.tsx`** — find:
```typescript
scroll: {
  flex: 1,
  flexShrink: 1,
},
```
Change to:
```typescript
scroll: {
  flexShrink: 1,
},
```

**`app/(tabs)/index.tsx`** (Profile modal) — find:
```typescript
<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1, flexShrink: 1 }}>
```
Change to:
```typescript
<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
```

Do not attempt to re-solve the original "can't scroll to see all of a long entry" issue as part of this item — that needs separate investigation later. This item is strictly a revert to restore correct content display.

---

## 2. Ose Calendar — off-by-one day (anchor/target time-of-day mismatch)

**File:** `constants/spiritualData.ts`

`getOseDay()` normalizes the target date to local noon before diffing, but the anchor constant has no time component (local midnight):

```typescript
const OSE_ANCHOR_MS = new Date(2026, 3, 26).getTime(); // April 26, 2026 = Day 0
```

This bakes in a constant +12-hour offset, and since `Math.round()` rounds `.5` up, every single day in the cycle comes out exactly one day ahead of correct (verified by running the actual function: it returns "Ifa" for both Aug 4 and Aug 8, 2026, when the authoritative Ose calendar shows both as "Obatala"). Fix by aligning the anchor to the same noon convention as the target date:

```typescript
const OSE_ANCHOR_MS = new Date(2026, 3, 26, 12, 0, 0).getTime(); // April 26, 2026, noon = Day 0
```

Do not change `getOseDay()`'s body, `OSE_GROUPS`, or the cycle order — those are all correct as-is (verified against https://www.ashesoul.com/osecalendar).

---

## 3. Manual export success message — misleading when no folder set (Android)

**File:** `components/BackupRestoreModal.tsx`

Note: this item is superseded in behavior by item 4 below (Android local export will always have a folder by the time it succeeds, once item 4 lands), but apply it anyway as a direct, defensive fix to the message logic itself — don't rely solely on item 4 to make this branch unreachable.

Find:
```typescript
showFeedback(
  "success",
  Platform.OS === "ios"
    ? "✦ Saved to Documents — find it in the Files app or enable iCloud Drive to sync automatically."
    : backupFolderUri
      ? `✦ Saved to ${getBackupFolderDisplayName(backupFolderUri)}.`
      : "✦ Saved to Documents — find it in your Files app."
);
```
Change the final `else` branch (Android, no folder) to be honest about where the file actually went, matching the wording already used elsewhere in this same modal for this exact state:
```typescript
showFeedback(
  "success",
  Platform.OS === "ios"
    ? "✦ Saved to Documents — find it in the Files app or enable iCloud Drive to sync automatically."
    : backupFolderUri
      ? `✦ Saved to ${getBackupFolderDisplayName(backupFolderUri)}.`
      : "✦ Saved to app storage — not visible in Files. Choose a backup folder to save somewhere you can find it."
);
```

---

## 4. Require a backup folder on Android — no more invisible-storage fallback

**Files:** `utils/backup.ts`, `components/BackupRestoreModal.tsx`

Currently, on Android, if no backup folder is chosen, both manual "Local" export and auto-backup silently fall back to writing into the app's private sandbox storage — a location that is never visible in any file manager. This is confusing (the export reports "success" but the user can never find the file). Change this so Android always requires a folder for local storage — no more invisible fallback. **iOS is unaffected by this entire item** — iOS already writes to `Paths.document`, which is genuinely visible via the Files app (`UIFileSharingEnabled` is already set), so iOS keeps its current behavior exactly as-is.

### 4a. `utils/backup.ts` — `exportBackup()`

Find the Android local-export block:
```typescript
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
```

Replace with (Android local now requires a folder and never falls through to the invisible sandbox; the Documents-write path becomes iOS-local-only plus the Cloud staging file for both platforms):

```typescript
  // Native — Android: local export requires a chosen SAF folder, no invisible fallback
  if (Platform.OS === "android" && destination === "local") {
    const folderUri = await getBackupFolderUri();
    if (!folderUri) {
      throw new Error("Choose a backup folder first.");
    }
    try {
      const fileUri = await StorageAccessFramework.createFileAsync(folderUri, filename, "application/json");
      await FileSystem.writeAsStringAsync(fileUri, json);
      await AsyncStorage.setItem(LAST_MANUAL_EXPORT_KEY, Date.now().toString());
      return;
    } catch {
      throw new Error("Couldn't save to your chosen folder — it may have been moved or its permission revoked. Choose the folder again.");
    }
  }

  // Native — write to Documents folder (iOS local export, or staging file for Cloud share on either platform)
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
```

### 4b. `utils/backup.ts` — `exportBackupSilent()` (auto-backup)

Find:
```typescript
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
    try {
      const { File, Paths } = await import("expo-file-system");
      const file = new File(Paths.document, filename);
      file.write(json);
    } catch {
      // If even the Documents fallback fails, don't crash — but don't silently
      // pretend it succeeded either. Re-throw so runAutoBackupIfDue's outer
      // catch handles it consistently (still silent to the user, per existing
      // design), rather than leaving LAST_AUTO_BACKUP_KEY stale forever.
      throw new Error("Auto-backup Documents fallback write failed");
    }
  }
  await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, Date.now().toString());
}
```

Replace with (Android skips entirely — no write, no invisible fallback — when no folder is chosen or the chosen folder fails; iOS keeps its existing Documents-write behavior with the same defensive try/catch from the last round):

```typescript
async function exportBackupSilent(): Promise<void> {
  const backup = await buildBackupData();
  const json = JSON.stringify(backup, null, 2);
  const filename = generateBackupFilename();

  if (Platform.OS === "android") {
    const folderUri = await getBackupFolderUri();
    if (!folderUri) {
      // No folder chosen — skip rather than writing somewhere invisible.
      // The UI already warns "Auto-backup is on — choose a folder" in this state.
      return;
    }
    try {
      const fileUri = await StorageAccessFramework.createFileAsync(folderUri, filename, "application/json");
      await FileSystem.writeAsStringAsync(fileUri, json);
      await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, Date.now().toString());
    } catch {
      // Chosen folder failed (moved / permission revoked) — skip rather than
      // silently falling back to invisible app storage.
    }
    return;
  }

  if (Platform.OS !== "web") {
    try {
      const { File, Paths } = await import("expo-file-system");
      const file = new File(Paths.document, filename);
      file.write(json);
    } catch {
      throw new Error("Auto-backup Documents fallback write failed");
    }
  }
  await AsyncStorage.setItem(LAST_AUTO_BACKUP_KEY, Date.now().toString());
}
```

### 4c. `components/BackupRestoreModal.tsx` — `handleExport()`

Find:
```typescript
  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      await exportBackup(exportDest);
```

Change to (prompt for a folder first if Android + Local + none set yet; abort cleanly if the user cancels the picker, matching the existing `handlePickFolder` pattern already in this file):

```typescript
  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === "android" && exportDest === "local" && !backupFolderUri) {
      const uri = await pickBackupFolder();
      if (!uri) {
        showFeedback("error", "Choose a backup folder to save locally.");
        return;
      }
      setBackupFolderUri(uri);
    }

    setExporting(true);
    try {
      await exportBackup(exportDest);
```
Do not change anything else in this function — the existing try/catch, `finally`, and success-message logic (including item 3's fix above) stay as they are.

### 4d. Copy updates now that Android no longer has an invisible fallback

**Backup Folder section caption** — find:
```typescript
<Text style={s.sectionHint}>
  Local exports and auto-backups write to this folder. Cloud (Share) always opens the share sheet, regardless of this setting. If not set, files save to your internal Documents folder.
</Text>
```
Change to:
```typescript
<Text style={s.sectionHint}>
  Local exports and auto-backups write to this folder. Cloud (Share) always opens the share sheet, regardless of this setting. Required on Android for Local exports and auto-backup — you'll be prompted to choose one if it's not set yet.
</Text>
```

**Auto-Backup no-folder hint** — find:
```typescript
: "No folder chosen — tap 'Backup Folder' below to set a destination, or backups save to Documents."
```
Change to:
```typescript
: "No folder chosen — auto-backup won't run until you tap 'Backup Folder' below to set one."
```

---

## VERIFICATION CHECKLIST

- [ ] Full moon / dark moon / sabbat detail cards (e.g. Harvest Full Moon) display their full content again — description, rows, timing, guidance all visible (not collapsed to just title + Close)
- [ ] Ose detail cards display full content again
- [ ] Profile modal shows First Name and both birth fields again (not just Cancel/Save)
- [ ] Ose Calendar shows Obatala on August 4 and August 8, 2026 (and generally matches https://www.ashesoul.com/osecalendar for any other date spot-checked)
- [ ] Android, no backup folder chosen, tap "Export" with "Local (Device)" selected: folder picker opens automatically; choosing a folder completes the export and shows "Saved to [folder name]"; canceling the picker aborts the export with a clear message and does NOT show a false success
- [ ] Android, no backup folder chosen, Auto-Backup set to Daily/Weekly: after the scheduled time passes, "Last auto-backup" stays unchanged (no invisible write happens) — the existing "choose a folder" warning banner already covers telling the user why
- [ ] Android, backup folder chosen: both manual Local export and auto-backup continue working exactly as before (no regression)
- [ ] iOS: Local export and auto-backup behavior is completely unchanged (still writes to Documents, still visible in Files app, no folder-picker prompt ever appears)
- [ ] Cloud (Share) export is unaffected on both platforms — no folder requirement, still always opens the share sheet
- [ ] Backup Folder caption and Auto-Backup no-folder hint reflect the new no-fallback behavior on Android
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
