Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, layout, spacing, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

This is a large, mechanical patch touching many files — work through the files in the priority order listed below, and after EACH file, report a one-line status ("done, N fontSize values updated in FileName.tsx") before moving to the next, so any issue can be caught early rather than only at the very end.

---

## Background — the bug

The app's font-scale accessibility setting (`useFontScale()` from `@/contexts/FontScaleContext`, exposing an `fs(n)` function) currently only affects text in 5 files: `app/(tabs)/index.tsx`, `components/SunMoonBar.tsx`, `app/(tabs)/journal.tsx`, `app/(tabs)/prayer.tsx`, and `app/(tabs)/resources.tsx`. Every other screen and modal in the app has hardcoded `fontSize` values that never respond to this setting — confirmed on-device, changing the font scale setting only visibly resizes the Home screen's greeting text and the sun/moon times card, nothing else.

## The established, working pattern — replicate this exactly

`index.tsx` and `SunMoonBar.tsx` already solve this correctly. Their static `StyleSheet.create({...})` blocks are left completely untouched (still hold layout, color, fontWeight, etc.) — the fix is applied at each `<Text>` (or `<TextInput>`) usage site, by adding an inline `fontSize: fs(N)` override alongside the existing static style reference. Example of the exact pattern already in the codebase (`index.tsx` line ~397):

```typescript
<Text style={[styles.appName, { color: "#D4A843", fontSize: fs(22) }]}>
```

Where `22` is whatever the original static fontSize value was for that piece of text.

## Required steps for EACH file listed below

1. Add the import: `import { useFontScale } from "@/contexts/FontScaleContext";` (adjust relative path if the file isn't under `app/` or `components/` at the same depth as existing examples — match however `journal.tsx` or `resources.tsx` already imports it from its location)
2. Inside the component function, add: `const { fs } = useFontScale();`
3. Find every `fontSize: N` in that file — whether it's inline in JSX already, or inside the module-level `StyleSheet.create({...})` block at the bottom of the file — and ensure the text element using it ends up rendering with `fontSize: fs(N)` instead of the raw static number, via the inline-override pattern shown above. Do NOT delete the original static `fontSize: N` from the `StyleSheet.create` block itself — leave it in place as a fallback default; just add the `fs()`-driven override at each usage site so it takes precedence.
4. Do not touch any `size={N}` props on icon components (e.g. `<Feather name="x" size={20} />`) — only text elements. Icon sizing is a separate, intentional design decision and is out of scope here.
5. Do not change any fontWeight, color, lineHeight, letterSpacing, or layout-related style values — only the fontSize handling.

## Files to update, in priority order

**Tier 1 — Calendar (most-used screen after Home):**
- `app/(tabs)/calendar.tsx` (21 fontSize occurrences)
- `components/MonthView.tsx` (2)
- `components/WeekView.tsx` (5)
- `components/DayView.tsx` (10)
- `components/ScheduleView.tsx` (9)
- `components/AlmanacView.tsx` (11)

**Tier 2 — Home screen supporting components:**
- `components/TodayWidget.tsx` (7)

**Tier 3 — Detail modals:**
- `components/EventDetailModal.tsx` (8)
- `components/OseDetailModal.tsx` (10)

**Tier 4 — Settings & utility modals:**
- `components/NotificationSettingsModal.tsx` (13)
- `components/BackupRestoreModal.tsx` (25)

**Tier 5 — Ritual/journal-adjacent modals:**
- `components/MoonWaterModal.tsx` (25)
- `components/IntentionsModal.tsx` (36)
- `components/LunarLetterModal.tsx` (15)
- `components/LunarLettersHistoryModal.tsx` (5)
- `components/LunarIntentionsHistoryModal.tsx` (6)
- `components/MoonSoundBath.tsx` (13)
- `components/SacredAltar.tsx` (14)
- `components/VoicePickerModal.tsx` (5)

If you find a `fontSize` occurrence in any of these files that is NOT attached to a text-rendering element (e.g. it's part of an icon library's internal prop, or a non-visual constant), skip it and note that you skipped it in your per-file status report, rather than guessing.

---

## VERIFICATION CHECKLIST

- [ ] Changing the font scale setting now visibly resizes text on the Calendar tab (all four view modes: month/week/day/schedule) and the Almanac view
- [ ] Changing the font scale setting visibly resizes text in the Event Detail and Ose Detail modals
- [ ] Changing the font scale setting visibly resizes text in Notification Settings and Backup/Restore modals
- [ ] Changing the font scale setting visibly resizes text in Moon Water, Sacred Intentions, Lunar Letter (and its history), Lunar Intentions history, Moon Sound Bath, and Sacred Altar
- [ ] The previously-working screens (Home greeting, sun/moon card, Journal, Prayer, Resources) still scale correctly and were not altered
- [ ] No icon sizes changed anywhere
- [ ] No fonts, colors, navigation, layout, or unrelated feature behavior changed anywhere else in the app
