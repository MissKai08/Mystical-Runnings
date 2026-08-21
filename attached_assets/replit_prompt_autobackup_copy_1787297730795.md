Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

## Auto-Backup copy fix — clarify it only runs on app open, not in the background

**File:** `components/BackupRestoreModal.tsx`

This is a copy-only change, no logic changes. Auto-backup is only ever checked inside a `useEffect` on app launch (`runAutoBackupIfDue()` in `_layout.tsx`) — there's no background task, so if the app isn't opened, no backup happens that day even on "Daily." The current copy ("Next: In ~22h") implies a timer that fires on its own, which is misleading. Make three text-only changes:

1. Change the badge label from "Next:" to "Due:":
```typescript
// CURRENT
<Text style={s.nextRunBadge}>
  Next: {nextRunLabel(autoFreq, lastAutoBackup)}
</Text>

// FIX
<Text style={s.nextRunBadge}>
  Due: {nextRunLabel(autoFreq, lastAutoBackup)}
</Text>
```

2. Add a new clarifying line right after the "Auto-backup is off" / frequency hint block, before the existing platform-specific destination text. The block currently looks like:
```typescript
{autoFreq === "off" ? (
  <Text style={s.sectionHint}>
    Auto-backup is off. Use the Export button below to save manually whenever you like.
  </Text>
) : (
  <Text style={s.sectionHint}>
    {Platform.OS === "ios"
      ? "Saves silently to your Documents folder (syncs to iCloud Drive if enabled in Settings)."
      : Platform.OS === "android"
      ? backupFolderUri
        ? "Saves silently to your chosen backup folder."
        : "No folder chosen — auto-backup won't run until you tap 'Backup Folder' below to set one."
      : "Saves a backup file each time the schedule is due."}
  </Text>
)}
```
Replace it with:
```typescript
{autoFreq === "off" ? (
  <Text style={s.sectionHint}>
    Auto-backup is off. Use the Export button below to save manually whenever you like.
  </Text>
) : (
  <Text style={s.sectionHint}>
    Checked each time you open the app — if it's due, it backs up then. It won't run while the app is closed.
  </Text>
)}
{autoFreq !== "off" && (
  <Text style={s.sectionHint}>
    {Platform.OS === "ios"
      ? "Saves silently to your Documents folder (syncs to iCloud Drive if enabled in Settings)."
      : Platform.OS === "android"
      ? backupFolderUri
        ? "Saves silently to your chosen backup folder."
        : "No folder chosen — auto-backup won't run until you tap 'Backup Folder' below to set one."
      : "Saves a backup file each time the schedule is due."}
  </Text>
)}
```

## VERIFICATION CHECKLIST
- [ ] Backup & Restore modal, Auto-Backup section shows "Due: In ~Xh/Xd" instead of "Next: In ~Xh/Xd"
- [ ] New line "Checked each time you open the app — if it's due, it backs up then. It won't run while the app is closed." appears above the existing destination-specific line when Daily or Weekly is selected
- [ ] "Off" state copy unchanged
- [ ] No change to `runAutoBackupIfDue()`, `_layout.tsx`, or any scheduling logic — copy only
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
