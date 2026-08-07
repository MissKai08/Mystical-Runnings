Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: several items from earlier rounds are already confirmed working and are NOT included here — USNO sunrise/sunset/moonrise/moonset, notification permission requested on startup, and the 2027 Wheel of the Year Resources link. Do not touch those.

---

## 1. USNO moon phase dates — missing Eastern-time conversion

**File:** `constants/spiritualData.ts`

The `day`/`month`/`year` field-parsing fix from the last round is correct, but the cache key is still built directly from USNO's raw UTC date with no timezone conversion — this is the same class of bug the old `PHASE_LOOKUP` table had (confirmed: Dec 23 Cold Full Moon still shows as the 24th). Find the loop that builds `dayMap` (currently something like `dayMap[\`${entry.year}-${entry.month}-${entry.day}\`] = eventType;`) and replace it with:

```typescript
const dtf = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric", month: "numeric", day: "numeric",
});

const dayMap: Record<string, "new-moon"|"first-quarter"|"full-moon"|"last-quarter"> = {};
for (const entry of phasedata) {
  const eventType = USNO_PHASE_KEY_MAP[entry.phase];
  if (!eventType) continue;
  const [hh, mm] = entry.time.split(":").map(Number);
  const utcDate = new Date(Date.UTC(entry.year, entry.month - 1, entry.day, hh, mm));
  const parts = dtf.formatToParts(utcDate);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  dayMap[`${y}-${m}-${d}`] = eventType;
}
```
Using `Intl.DateTimeFormat` with `America/New_York` handles daylight saving automatically year-round.

---

## 2. Backup folder picker — wrong import path for StorageAccessFramework

**File:** `utils/backup.ts`

`expo-file-system` v19 moved `StorageAccessFramework` to a separate `/legacy` entry point. The current code casts `(FileSystem as any).StorageAccessFramework` off the main import, which is `undefined` at runtime — that's why tapping "Choose" does nothing visible and fails immediately. Fix:

```typescript
import { StorageAccessFramework } from "expo-file-system/legacy";
```
Remove the `const StorageAccessFramework: SAFType = (FileSystem as any).StorageAccessFramework;` workaround and the comment above it — no longer needed. Leave the existing `File`/`Paths` usage elsewhere in the file (for plain Documents-folder writes) untouched — only the SAF-specific import changes.

---

## 3. Modal scroll bugs — percentage maxHeight is unreliable, switch to pixel-based

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`, Profile modal in `app/(tabs)/index.tsx`

All three currently use a percentage string for `maxHeight` (e.g. `"80%"`, `"88%"`, `"85%"`) combined with `flex: 1` on their ScrollView. This combination is unreliable on Android — it has already caused at least one card (Lammas — High Summer) to render with an empty body instead of scrolling. Replace the percentage approach with a computed pixel value and `flexShrink: 1` in all three files:

```typescript
import { useWindowDimensions } from "react-native";
// inside the component:
const { height: screenHeight } = useWindowDimensions();
```
Then use `maxHeight: screenHeight * 0.8` (use `0.85` for the Profile modal, `0.88` for OseDetailModal, matching each file's current percentage) as an inline numeric style in place of the string percentage, and change each ScrollView's relevant style from `flex: 1` to `flexShrink: 1`.

---

## 4. Profile — birthday should be optional

**File:** `app/(tabs)/index.tsx`

`handleSaveProfile` currently requires a valid birth month AND day before it will save anything, including the first name alone. Replace with:

```typescript
const handleSaveProfile = useCallback(async () => {
  const name = profileDraft.firstName.trim();
  if (!name) return;
  const monthStr = profileDraft.birthMonth.trim();
  const dayStr = profileDraft.birthDay.trim();
  let birthMonth: number | undefined;
  let birthDay: number | undefined;
  if (monthStr || dayStr) {
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return;
    birthMonth = month;
    birthDay = day;
  }
  const p: UserProfile = { firstName: name, birthMonth, birthDay };
  await saveUserProfile(p);
  setProfile(p);
  setProfileOpen(false);
}, [profileDraft]);
```
If `UserProfile`'s `birthMonth`/`birthDay` fields aren't already optional in its type definition, make them optional (`birthMonth?: number`, `birthDay?: number`) so this compiles cleanly.

---

## 5. Backup — Android messaging is misleading when no folder is chosen

**File:** `components/BackupRestoreModal.tsx`

The Android branch of the "Save to: Local" description currently says "Saves to your Documents folder. Open your Files app to find it." — that's only true once a backup folder has been picked (see item 2). Without one, the file lands in the app's private sandbox and is genuinely not visible anywhere. Update the Android message to only claim Files-app visibility once a folder has been picked; otherwise be upfront about it:

```typescript
Platform.OS === "ios"
  ? "Saves to your Documents folder. Open the Files app to find it. Enable iCloud Drive to sync it automatically."
  : backupFolderUri
    ? "Saves to your chosen backup folder."
    : "Saves to app storage — not visible in Files. Choose a backup folder above to save somewhere you can find."
```
(Adjust variable name to whatever the component already uses to track the picked folder URI/state.)

---

## 6. Daily Briefing / Daily Odu / Sacred Intention — never scheduled for today

**File:** `utils/notificationScheduler.ts`

All three 30-day pre-scheduling loops build their date range starting from `addDays(now2, i + 1)` with `i` starting at `0` — meaning "today" is never included, only tomorrow through day 30. Since these get rescheduled automatically now (thanks to the auto-save fix), any reschedule that happens before today's trigger time still skips today entirely. In all three loops, change:
```typescript
const date = addDays(now2, i + 1);
```
to:
```typescript
const date = addDays(now2, i);
```
The existing `if (trigger <= now2) continue;` check already correctly skips today if its time has already passed — this fix just gives it the chance to run for today at all.

---

## 7. Notification settings — clearer copy separating event reminders from daily notifications

**File:** `components/NotificationSettingsModal.tsx`

Rename the "NOTIFY ME" section header to **"EVENT REMINDERS"**, and add an intro line clarifying it applies to the upcoming sabbats/moons/holidays listed further down (not the daily notifications below it). Split the current single dense paragraph ("Reminder delivered at 8:00 AM on the selected day before each event. Ifa Prayer Days notify at 7:00 AM every Thursday. Ose Calendar transitions notify at 7:00 AM on the day they begin.") into two separate lines:
- "Delivered at 8:00 AM, {advanceDays} day(s) before each event." (dynamic based on the selected 1/2/3-day option)
- "Two exceptions fire same-day, regardless of this setting: Ifa Prayer Day at 7:00 AM every Thursday, and Ose Calendar transitions at 7:00 AM on the day they begin."

Rename "MORNING BRIEFING" to **"DAILY NOTIFICATIONS"**, add an intro line clarifying these are separate from event reminders above and each repeats daily at its own fixed time (already shown per-row). Remove the old summary line below the toggle list ("Delivers at 7 AM each morning...") since it only described one of the four rows and is now redundant with each row's own time.

Add this style if not already present, near `sectionLabel`:
```typescript
sectionIntro: {
  fontSize: 12,
  marginBottom: 8,
  lineHeight: 16,
},
```

---

## VERIFICATION CHECKLIST

- [ ] Dec 23, 2026 shows the Cold Full Moon (not the 24th)
- [ ] Any other early-UTC-morning phase this year/next lands on the correct Eastern-time day
- [ ] Tapping "Choose" under Backup Folder actually opens the Android system folder picker
- [ ] Full moon / dark moon / sabbat detail cards scroll and display fully, including Lammas — High Summer
- [ ] Ose detail cards scroll and display fully
- [ ] Profile modal scrolls fully with the keyboard open
- [ ] Profile: entering only a first name and saving works, no birthday required
- [ ] Profile: entering a name + valid birthday still saves both and triggers the birthday calendar message
- [ ] Android, no backup folder chosen: "Local" export messaging honestly says it's not visible in Files, not "open your Files app"
- [ ] Android, backup folder chosen: messaging reflects that
- [ ] Daily Sacred Briefing, Daily Odu Reflection, and Sacred Intention Check-In can all fire on the same day they were most recently (re)scheduled, if their time hasn't passed yet
- [ ] Notification settings screen clearly separates "Event Reminders" from "Daily Notifications" with no shared/confusing time references
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
