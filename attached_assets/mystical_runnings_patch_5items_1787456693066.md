Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Notifications not re-scheduled after backup restore

**File:** `utils/backup.ts`

Restoring a backup writes settings values (including `masterEnabled`, `dailyBriefing`, etc.) back into AsyncStorage, but nothing actually re-triggers the OS-level notification scheduling — `scheduleAllNotifications()` is currently only ever called from inside `NotificationSettingsModal`'s auto-save handler. The result: after a restore, the in-app settings correctly show "on," but nothing is actually scheduled with the OS until the user manually toggles the master switch off and back on.

In the `restoreBackup()` function, after the restored data has been successfully written to AsyncStorage (at the end of a successful restore, before returning), add:
```typescript
import { scheduleAllNotifications } from "@/utils/notificationScheduler";
import { loadNotificationSettings } from "@/utils/notificationSettings";

// ...at the end of a successful restoreBackup(), after all keys are written:
try {
  const settings = await loadNotificationSettings();
  if (settings.masterEnabled) {
    await scheduleAllNotifications(settings);
  }
} catch (e) {
  console.warn("Failed to reschedule notifications after restore:", e);
}
```
(Adjust the import path/function name for `loadNotificationSettings` if it differs slightly from this — confirm against the actual export in `utils/notificationSettings.ts` before applying. Wrap in try/catch so a scheduling failure never blocks the restore itself from completing successfully.)

---

## 2. Journal — Month view crowds out the scroll-to-entry target

**File:** `app/(tabs)/journal.tsx`

Tapping a highlighted date in Month view correctly scrolls the matching entry into view, but the Month calendar grid is tall enough that the entry ends up in a thin, barely-visible sliver of screen below it. Auto-switch to Week view (a much shorter strip) whenever a date with an entry is tapped, so the scrolled-to entry actually has room to be seen:

```typescript
// CURRENT
const handleDayPress = useCallback((date: string) => {
  const offset = offsetMap.current.get(date);
  if (offset !== undefined) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 16), animated: true });
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightDate(date);
    highlightTimer.current = setTimeout(() => setHighlightDate(null), 2000);
  }
}, []);

// FIX
const handleDayPress = useCallback((date: string) => {
  const offset = offsetMap.current.get(date);
  if (offset !== undefined) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalMode("week");
    scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 16), animated: true });
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightDate(date);
    highlightTimer.current = setTimeout(() => setHighlightDate(null), 2000);
  }
}, [setCalMode]);
```

---

## 3. Journal — move Lunar Intentions button under Sacred Intentions

**File:** `app/(tabs)/journal.tsx`

The Lunar Intentions history button currently sits below the Week/Month calendar toggle and grid, which caused confusion about what the toggle actually controls. Move it up to sit directly under the Sacred Intentions button, above the calendar toggle.

Find this existing block (currently positioned right after the `{calMode === "week" ? <WeekStrip.../> : <MonthHeatmap.../>}` section):
```typescript
{/* Lunar Intentions history */}
<Pressable
  onPress={() => { Haptics.selectionAsync(); setLunarIntentionsHistoryOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#C4B5FD14", borderColor: "#C4B5FD44", marginTop: 8 }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#C4B5FD" }]}>🌑</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#C4B5FD" }]}>
    Lunar Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#C4B5FD88" />
</Pressable>
```
**Remove it from that location**, and **insert it instead** directly after the Sacred Intentions `<Pressable>` block (which currently ends right before the `{/* Calendar mode toggle */}` comment):
```typescript
{/* Sacred Intentions button */}
<Pressable
  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIntentionsOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#7C3AED14", borderColor: "#7C3AED44" }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#A78BFA" }]}>○</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#A78BFA" }]}>
    Sacred Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#A78BFA88" />
</Pressable>

{/* Lunar Intentions history — moved here, directly under Sacred Intentions */}
<Pressable
  onPress={() => { Haptics.selectionAsync(); setLunarIntentionsHistoryOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#C4B5FD14", borderColor: "#C4B5FD44", marginTop: 8 }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#C4B5FD" }]}>🌑</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#C4B5FD" }]}>
    Lunar Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#C4B5FD88" />
</Pressable>

{/* Calendar mode toggle */}
<View style={styles.calToggleRow}>
  ...
```
This is a relocation, not a duplication — make sure the block only appears once in the file after this change, in its new position.

---

## 4. Prayer Voice Picker — Default option should be previewable like other voices

**File:** `components/VoicePickerModal.tsx`

Every custom voice previews itself with `PREVIEW_TEXT` at `pitch: 0.85, rate: 0.65` when tapped (matching actual prayer playback settings), but the "System Default" option only sets selection with no audio preview — inconsistent with the rest of the list.

**4a.** Replace `handleClear`:
```typescript
// CURRENT
async function handleClear() {
  Haptics.selectionAsync();
  Speech.stop();
  setSelectedId(null);
  setPreviewingId(null);
  await clearVoicePreference();
}

// FIX
async function handleClear() {
  Haptics.selectionAsync();
  setSelectedId(null);
  await clearVoicePreference();
  Speech.stop();
  setPreviewingId("default");
  Speech.speak(PREVIEW_TEXT, {
    pitch: 0.85,
    rate: 0.65,
    onDone: () => setPreviewingId(null),
    onError: () => setPreviewingId(null),
  });
}
```

**4b.** In the Default option row, update the icon to reflect preview state:
```typescript
// CURRENT
<Feather
  name="volume-2"
  size={16}
  color={selectedId === null ? "#D4A843" : colors.mutedForeground}
/>

// FIX
<Feather
  name={previewingId === "default" ? "volume-2" : "volume-1"}
  size={16}
  color={selectedId === null ? "#D4A843" : colors.mutedForeground}
/>
```

**4c.** Update the checkmark/spinner block for the Default row:
```typescript
// CURRENT
{selectedId === null && (
  <Feather name="check" size={16} color="#D4A843" />
)}

// FIX
{selectedId === null && previewingId !== "default" && (
  <Feather name="check" size={16} color="#D4A843" />
)}
{previewingId === "default" && (
  <ActivityIndicator size="small" color="#D4A843" />
)}
```

---

## 5. Resources — sort links alphabetically within each category

**File:** `app/(tabs)/resources.tsx`

Links currently appear within each category section in the order they were added to `RESOURCES`, not alphabetically. Fix the render loop:

```typescript
// CURRENT (line ~359)
const items = RESOURCES.filter((r) => r.category === cat);

// FIX
const items = RESOURCES.filter((r) => r.category === cat).sort((a, b) => a.title.localeCompare(b.title));
```

---

## VERIFICATION CHECKLIST

- [ ] Fresh restore of a backup with notifications previously enabled fires scheduled notifications WITHOUT needing to manually toggle the master switch off/on
- [ ] Restore still completes successfully even if notification rescheduling fails for some reason (no crash, no blocked restore)
- [ ] Journal: tapping a date with an entry while in Month view auto-switches to Week view and scrolls the entry clearly into view
- [ ] Journal: the highlighted entry is fully visible (not cut off behind the header) after the auto-switch
- [ ] Journal: Lunar Intentions button now appears directly under Sacred Intentions, above the Week/Month toggle
- [ ] Journal: Lunar Intentions button appears only once in the screen (no duplicate)
- [ ] Journal: Week/Month toggle and calendar grid still function normally, just visually relocated below both buttons now
- [ ] Prayer Voice Picker: tapping "System Default" now plays a preview, exactly like tapping any other voice
- [ ] Prayer Voice Picker: the Default row shows a loading spinner while previewing, then reverts to showing the checkmark
- [ ] Prayer Voice Picker: selecting Default still correctly clears any custom voice preference and is used for actual prayer playback
- [ ] Resources: links within every category now appear in alphabetical order by title
- [ ] Resources: category sections themselves remain in alphabetical order (unaffected by this change)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
