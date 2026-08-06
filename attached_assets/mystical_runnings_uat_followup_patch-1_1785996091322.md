Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. USNO sun/moon rise/set — fix field name mismatch

**File:** `hooks/useSunMoon.ts`

USNO's actual API returns `"phen": "Rise"` and `"phen": "Set"` (full words), not `"R"`/`"S"`. In `fetchUsnoTimes`, change:
```typescript
sunrise: findTime(sundata, "R"),
sunset: findTime(sundata, "S"),
moonrise: findTime(moondata, "R"),
moonset: findTime(moondata, "S"),
```
to:
```typescript
sunrise: findTime(sundata, "Rise"),
sunset: findTime(sundata, "Set"),
moonrise: findTime(moondata, "Rise"),
moonset: findTime(moondata, "Set"),
```
Also add a safety check right after building the result object: if `sunrise`, `sunset`, `moonrise`, and `moonset` are all `null`, return `null` from the function instead of the object, so a malformed/empty USNO response always triggers the existing SunCalc fallback rather than silently displaying blank times.

---

## 2. Kill `PHASE_LOOKUP`, use USNO for all moon phases

**File:** `constants/spiritualData.ts`

The hardcoded `PHASE_LOOKUP` table (2024–2027) stores each phase under USNO's raw UTC calendar day without converting to Eastern time, which silently shifts ~1 in 5 entries to the wrong day (confirmed against live USNO data for 2026). Remove `PHASE_LOOKUP` entirely as a data source.

Also fix a separate, more severe bug: the USNO year-phases integration (`prefetchUsnoPhases`) assumes the API returns `{ phase, date: "YYYY MMM DD", time }`. It actually returns `{ phase, day, month, year, time }` as separate number fields — no `date` string exists. This makes `entry.date.split(" ")` throw on every call, which gets silently caught, meaning `USNO_YEAR_CACHE` has never actually been populated for any year. Fix:

```typescript
const json = await resp.json() as { phasedata?: { phase: string; day: number; month: number; year: number; time: string }[] };
const phasedata = json?.phasedata ?? [];

const dayMap: Record<string, "new-moon"|"first-quarter"|"full-moon"|"last-quarter"> = {};
for (const entry of phasedata) {
  const eventType = USNO_PHASE_KEY_MAP[entry.phase];
  if (eventType) {
    dayMap[`${entry.year}-${entry.month}-${entry.day}`] = eventType;
  }
}
```
Delete the now-unused `parseUsnoPhaseDate` function and `MONTH_ABBR` array.

Restructure `getMoonPhaseData()` so USNO (via `USNO_YEAR_CACHE`, populated by `prefetchUsnoPhases`) is the primary source for **every** year, not just years outside a hardcoded table. On app startup, call `initUsnoCache()` / `prefetchUsnoPhases()` for the current year plus the next year, and prefetch additional years in the background as the user navigates the calendar to dates outside what's cached — cache each year's result in AsyncStorage (key `` `@usno_phases_${year}` ``, 30-day TTL) so it's only fetched once per year per device. The existing mathematical formula becomes the true last-resort fallback, used only when there's no cache for that year AND the network fetch fails (e.g. fully offline on first launch).

---

## 3. Backup folder picker — not opening at all

**File:** `utils/backup.ts`

`pickBackupFolder()` currently loads `expo-file-system` via a dynamic `await import("expo-file-system")` cast to `any`. This is unreliable for accessing a nested native namespace like `StorageAccessFramework` and is failing silently before the system picker ever launches. Replace with a static import at the top of the file:
```typescript
import * as FileSystem from "expo-file-system";
```
Then use `FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()` directly (and update the other `fs.StorageAccessFramework.createFileAsync(...)` call sites the same way) instead of the dynamic import pattern.

**File:** `components/BackupRestoreModal.tsx`

Wrap `handlePickFolder()` in a try/catch. On any failure (including `granted: false`), show the existing feedback-toast mechanism with a clear message like "Couldn't set backup folder — try again," so a failure is never silent again.

---

## 4. Notification permission never actually requested on fresh install

**File:** `app/_layout.tsx`

`masterEnabled` defaults to `true`, but the OS notification permission prompt is currently only triggered reactively inside the settings modal's toggle handler — it's never requested on app startup. Result: on a fresh install, the setting says "on" but the OS was never asked, so nothing can actually fire. Fix: in the startup effect where settings are loaded (same place/pattern location permission is already requested), if the loaded `masterEnabled` is `true`, call `requestPermissions()` from `utils/notificationScheduler.ts` proactively — matching how location already behaves on first launch.

---

## 5. Modal scroll bugs — three separate modals cutting off content

These are three instances of the same root issue: a bottom-sheet-style modal with no bounded height and no working scroll, so content taller than the visible area is silently lost.

**File:** `components/EventDetailModal.tsx`
- Add `style={styles.scrollArea}` to the `ScrollView`, with `scrollArea: { flex: 1 }` added to `styles`.
- Add `overflow: "hidden"` to the existing `sheet` style (which already has `maxHeight: "80%"`).

**File:** `components/OseDetailModal.tsx`
- The `scroll` style currently has `flexGrow: 0`, which is backwards — change to `flex: 1`.
- Confirm the modal's outer sheet container also has `overflow: "hidden"` alongside its existing `maxHeight: "88%"`; add if missing.

**File:** `app/(tabs)/index.tsx` — Profile modal specifically (do NOT change the shared `intentionModalSheet` style itself, since the Lunar Intention modal that also uses it works fine as-is)

Restructure just the Profile modal's JSX: give its sheet an inline `maxHeight: "85%"` override, wrap everything from the handle through the birth-day input in a `ScrollView` with `keyboardShouldPersistTaps="handled"`, and keep the Cancel/Save Profile button row outside the ScrollView so it stays pinned at the bottom regardless of scroll position:
```typescript
<Pressable
  style={[styles.intentionModalSheet, { maxHeight: "85%", paddingBottom: Math.max(24, insets.bottom + 16) }]}
  onPress={(e) => e.stopPropagation()}
>
  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    {/* handle, title, subtitle, First Name input, Birth Month/Day row — unchanged, just moved inside this ScrollView */}
  </ScrollView>
  <View style={[styles.intentionModalBtns, { marginTop: 16 }]}>
    {/* Cancel / Save Profile buttons — unchanged, stays outside the ScrollView */}
  </View>
</Pressable>
```

---

## 6. Resources — add 2027 Wheel of the Year link

**File:** `app/(tabs)/resources.tsx`

Right after the existing "2026 Wheel of the Year Calendar" entry in the Paganism category, add:
```typescript
{
  title: "2027 Witch's Wheel of the Year Calendar",
  source: "Witch on Fire · Patheos",
  category: "Paganism",
  url: "https://www.patheos.com/blogs/witchonfire/2026/07/2027-witchs-wheel-of-the-year-calendar/",
  emoji: "🌿",
  color: "#34D399",
},
```

---

## VERIFICATION CHECKLIST

- [ ] Sunrise/sunset/moonrise/moonset show real times, not blank dashes
- [ ] Sun/moon times still work with airplane mode on (SunCalc fallback intact)
- [ ] Moon phase is correct for a date this week, and for a date past 2027
- [ ] No hardcoded `PHASE_LOOKUP` table remains in `spiritualData.ts`
- [ ] Tapping "Choose" under Backup Folder actually opens the Android folder picker
- [ ] Cancelling the folder picker shows a clear error message, not silence
- [ ] Fresh install: OS notification permission prompt appears on first launch, not only after toggling settings off/on
- [ ] Full moon / dark moon / sabbat detail cards scroll fully to show all content (timing text, guidance, etc.)
- [ ] Ose detail cards scroll fully
- [ ] Profile modal: all fields and the Save button are reachable and visible with the keyboard open
- [ ] 2027 Wheel of the Year link appears under Resources → Paganism
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
