Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: everything from the last several rounds is already confirmed live and working — modal scroll display, Ose Calendar date accuracy, the export success message wording, and the Android backup-folder requirement itself. Do not touch any of that. This round is two small, isolated fixes only.

---

## 1. Backup writes failing/producing 0-byte files — wrong `expo-file-system` import mixed with legacy SAF

**File:** `utils/backup.ts`

`StorageAccessFramework.createFileAsync()` is correctly imported from the legacy API, but `FileSystem.writeAsStringAsync()` — used right after it, against the `content://` URI that `createFileAsync` returns — is imported from the modern/main `expo-file-system` entry point instead. Mixing the two against a legacy-created SAF URI is unreliable: it explains both symptoms seen in testing — an "Export failed" error while the file still gets created (empty), and auto-backup files appearing in the folder while `Last auto-backup` never updates (the write step fails silently before reaching the status update). Every exported file confirmed showing 0 B regardless of outcome.

Find:
```typescript
import * as FileSystem from "expo-file-system";
```
Change to:
```typescript
import * as FileSystem from "expo-file-system/legacy";
```
This is the only import line to change. `FileSystem` is used in exactly two places in this file (`writeAsStringAsync` inside `exportBackup()` and inside `exportBackupSilent()`), both already paired with `StorageAccessFramework`-issued URIs — no other code in this file needs to change.

---

## 2. "Local (Device)" hint — simplify when no folder is chosen

**File:** `components/BackupRestoreModal.tsx`

Find:
```typescript
: "Saves to app storage — not visible in Files. Choose a backup folder above to save somewhere you can find."
```
Change to:
```typescript
: "Saves locally. Choose a folder under Backup Folder below."
```

---

## VERIFICATION CHECKLIST

- [ ] Manual "Local (Device)" export with a backup folder chosen: exported JSON file has real content (not 0 B), confirmed by opening it in a file manager
- [ ] No "Export failed" error appears on a normal export to a valid, already-working folder
- [ ] Auto-backup (Daily/Weekly, folder chosen): after it fires, `Last auto-backup` updates to the correct timestamp, and the written file has real content (not 0 B)
- [ ] The "Local (Device)" hint under Save To reads simply "Saves locally. Choose a folder under Backup Folder below." when no folder is set
- [ ] No regressions to Cloud (Share) export, or to iOS backup behavior (untouched by this round)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
