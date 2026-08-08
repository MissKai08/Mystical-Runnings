Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Today screen — bottom content cut off by floating tab bar

**File:** `app/(tabs)/index.tsx`

The tab bar in `app/(tabs)/_layout.tsx` is `position: "absolute"` with `height: tabBarHeight` where `tabBarHeight = isWeb ? 84 : isAndroid ? 56 + insets.bottom : 60`. Since it floats over content instead of reserving space, every screen must pad its own scroll content by that same height. Today's ScrollView currently only pads by `insets.bottom`, not the tab bar's own height on top of that:

```typescript
contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
```

Replace with a `tabBarHeight` calculated the same way `_layout.tsx` does, and use it instead of `bottomPad` for this padding:

```typescript
const tabBarHeight = Platform.OS === "web" ? 84 : Platform.OS === "android" ? 56 + insets.bottom : 60;
```
(add near where `topPad`/`bottomPad` are already defined, reusing the existing `insets` and `Platform` already imported in this file)

```typescript
contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: tabBarHeight + 24 }]}
```

---

## 2. Modal scroll fix — EventDetailModal, OseDetailModal, Profile modal

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`, `app/(tabs)/index.tsx` (Profile modal)

Long content (e.g. the Harvest Full Moon card) doesn't scroll — `flexShrink: 1` alone doesn't reliably give the ScrollView a bounded box inside these sheets. Add `flex: 1` alongside it in all three places:

**`components/EventDetailModal.tsx`** — find:
```typescript
scrollArea: {
  flexShrink: 1,
```
Change to:
```typescript
scrollArea: {
  flex: 1,
  flexShrink: 1,
```

**`components/OseDetailModal.tsx`** — find:
```typescript
scroll: {
  flexShrink: 1,
},
```
Change to:
```typescript
scroll: {
  flex: 1,
  flexShrink: 1,
},
```

**`app/(tabs)/index.tsx`** (Profile modal) — find:
```typescript
<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
```
(this is the Profile modal's ScrollView, inside the sheet with `maxHeight: screenHeight * 0.85`) — change to:
```typescript
<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1, flexShrink: 1 }}>
```

---

## 3. Moon-phase cache key — read side missing Eastern-time conversion

**File:** `constants/spiritualData.ts`

The USNO cache is written using an Eastern-time-converted key (correct), but `getMoonPhaseData()`'s read-side lookup key uses the device's raw local date components instead:

```typescript
const cacheKey = `${year}-${date.getMonth() + 1}-${date.getDate()}`;
```

Replace with the same Eastern-time conversion pattern already used when the cache is built:

```typescript
const dtf = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric", month: "numeric", day: "numeric",
});
const parts = dtf.formatToParts(date);
const y = parts.find(p => p.type === "year")!.value;
const m = parts.find(p => p.type === "month")!.value;
const d = parts.find(p => p.type === "day")!.value;
const cacheKey = `${y}-${m}-${d}`;
```
Adjust variable names only as needed to avoid collisions with anything already in local scope at that point in the function — do not change surrounding logic.

---

## 4. Backup export success message — hardcoded "Saved to Documents"

**File:** `components/BackupRestoreModal.tsx`

`handleExport()`'s local-save success message always says "Saved to Documents" regardless of whether a backup folder is actually set:

```typescript
showFeedback(
  "success",
  Platform.OS === "ios"
    ? "✦ Saved to Documents — find it in the Files app or enable iCloud Drive to sync automatically."
    : "✦ Saved to Documents — find it in your Files app."
);
```

Make it reflect the actual destination. Reuse the same folder-name decoding already used for the folder label display (the `decodeURIComponent(backupFolderUri)` / split-on-`[:/]` logic near the `folderLabel` Text) to build a helper, then use it here:

```typescript
function getBackupFolderDisplayName(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const segs = decoded.split(/[:/]/);
    return segs[segs.length - 1] || "your chosen folder";
  } catch {
    return "your chosen folder";
  }
}
```

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

---

## 5. Add clear/reset control for backup folder

**Files:** `utils/backup.ts`, `components/BackupRestoreModal.tsx`

There's currently no way to unset a chosen backup folder — only "Choose"/"Change".

**`utils/backup.ts`** — add a new exported function near `getBackupFolderUri()`:
```typescript
/** (Android only) Clear the previously picked backup folder */
export async function clearBackupFolderUri(): Promise<void> {
  if (Platform.OS !== "android") return;
  await AsyncStorage.removeItem(BACKUP_FOLDER_URI_KEY);
}
```

**`components/BackupRestoreModal.tsx`** — import `clearBackupFolderUri` alongside the other backup util imports. Add a handler:
```typescript
async function handleClearFolder() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await clearBackupFolderUri();
  setBackupFolderUri(null);
  showFeedback("success", "Backup folder cleared.");
}
```
In the Backup Folder section (the `folderRow` View containing the folder icon, label, and the Change/Choose `Pressable`), add a small text-style "Clear" control next to "Change" — only rendered when `backupFolderUri` is set:
```typescript
{backupFolderUri && (
  <Pressable onPress={handleClearFolder} style={{ marginLeft: 8 }}>
    <Text style={[s.folderBtnText, { color: colors.mutedForeground }]}>Clear</Text>
  </Pressable>
)}
```
Place this directly after the existing "Change"/"Choose" `Pressable` inside `folderRow`, matching its existing layout conventions (don't restyle the row itself).

---

## 6. Backup Folder caption — clarify it doesn't apply to Cloud

**File:** `components/BackupRestoreModal.tsx`

Current caption under the Backup Folder section:
```typescript
<Text style={s.sectionHint}>
  Exports and auto-backups write to this folder. If not set, files save to your internal Documents folder.
</Text>
```
This is only true for Local exports + auto-backup — Cloud (Share) always opens the share sheet regardless. Reword:
```typescript
<Text style={s.sectionHint}>
  Local exports and auto-backups write to this folder. Cloud (Share) always opens the share sheet, regardless of this setting. If not set, files save to your internal Documents folder.
</Text>
```

---

## 7. Auto-Backup section — clarify it's local-only

**File:** `components/BackupRestoreModal.tsx`

Auto-backup has no cloud destination option (by design — see project history, a fake "Cloud" auto-backup was removed entirely since silent cloud upload isn't achievable on either platform without user interaction). This isn't currently stated anywhere in the Auto-Backup section copy. Add a line clarifying it. Find the Auto-Backup section's existing hint text (e.g. "Saves silently to your chosen backup folder." / the "Auto-backup is off..." / "No folder chosen..." variants), and add, immediately below whichever hint is currently shown:
```typescript
<Text style={s.sectionHint}>
  Auto-backup saves locally only — use Cloud (Share) above for manual cloud backups.
</Text>
```
Keep the existing conditional hint text as-is; this is an additional line, not a replacement.

---

## 8. Today screen's `today` value is stale-memoized

**File:** `app/(tabs)/index.tsx`

```typescript
const today = useMemo(() => new Date(), []);
```
This computes `new Date()` once on mount and never again — if the app stays open/backgrounded across a date rollover, or survives a dev-mode reload, everything downstream (Ose day highlight, moon phase data, header date) goes stale. `calendar.tsx` does not have this problem — it uses `const today = new Date();` fresh, unmemoized.

Replace with a version that is not permanently frozen:
```typescript
const today = new Date();
```
If `today` was memoized specifically to avoid unnecessary re-renders elsewhere, that's a lower priority than correctness here — plain unmemoized `new Date()` is fine; do not add complexity beyond this simple change.

---

## 9. Splash screen — reduce size (currently cropped/zoomed by `cover`)

**File:** `components/AppSplashScreen.tsx`

`splash.png` is a 3:4 image (3000×4000) but `resizeMode="cover"` scales it up to fill much taller phone screens, cropping the sides significantly and making the title/moon look oversized/zoomed compared to the source art. The image's own edges are near-pure-black (confirmed by pixel sampling), close to the app's theme background `#080714`, so switching to `contain` with a matching background color should look seamless without the crop:

```typescript
resizeMode="cover"
```
Change to:
```typescript
resizeMode="contain"
```
And add `backgroundColor: "#080714"` to the `ImageBackground`'s existing inline style object (the one currently containing `position: "absolute", top: 0, left: 0, width, height, zIndex: 9999, alignItems: "center", justifyContent: "flex-end"`).

---

## 10. Auto-backup Documents-fallback write — missing try/catch

**File:** `utils/backup.ts`

In `exportBackupSilent()`, the SAF (chosen-folder) write path is wrapped in `try/catch` with a graceful fallthrough, but the Documents-folder fallback path (used when no backup folder is set) is not:

```typescript
const { File, Paths } = await import("expo-file-system");
const file = new File(Paths.document, filename);
file.write(json);
```

If this throws for any reason, the exception propagates up through `runAutoBackupIfDue()`'s outer silent catch, and `LAST_AUTO_BACKUP_KEY` never gets set — auto-backup silently fails forever with no record, no error, and no way to tell from the UI. Wrap this fallback write in its own try/catch so a failure here degrades the same way the SAF path does:

```typescript
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
```
Do not change the outer `runAutoBackupIfDue()` catch behavior — it should remain silent to the user per existing design. This change only ensures the failure is contained and doesn't leave things in a half-finished state, and gives future debugging a real error to look at if reproduced with logging temporarily added.

---

## VERIFICATION CHECKLIST

- [ ] Today screen: last "Coming Up" row (or any bottom content) is fully visible above the tab bar, not clipped
- [ ] Full moon / dark moon / sabbat detail cards (e.g. Harvest Full Moon) scroll completely, including guidance text, before reaching Close
- [ ] Ose detail cards scroll completely
- [ ] Profile modal scrolls completely with keyboard open, birth month/day fields reachable
- [ ] Moon phase dates (e.g. Dec 23 Cold Full Moon) still land on the correct Eastern-time day
- [ ] Local export success message names the actual chosen folder (or says Documents only when genuinely unset)
- [ ] Backup Folder section has a working "Clear" control that appears only when a folder is set, and correctly reverts to "Not set — tap to choose"
- [ ] Backup Folder caption clearly states it doesn't apply to Cloud (Share)
- [ ] Auto-Backup section clearly states it's local-only, no cloud option
- [ ] Today screen's Ose Calendar highlight, moon phase, and header date stay accurate across a day rollover without force-closing the app (or at minimum, are correct on a fresh cold start matching the actual current date)
- [ ] Splash screen shows the full artwork without cropped/oversized title or moon, and any letterbox edges are visually seamless against the art's own background
- [ ] Auto-backup with NO folder chosen: after clearing app data and reopening with Daily/Weekly selected, "Last auto-backup" updates on next due run instead of staying "Never"
- [ ] Auto-backup with a folder chosen still works as before (no regression)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
