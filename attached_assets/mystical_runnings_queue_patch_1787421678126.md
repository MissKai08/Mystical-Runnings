Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Sacred Altar — Okra emoji swap

**File:** `components/SacredAltar.tsx`

The 🍆 emoji renders as eggplant regardless of color tinting. Replace it with 🥒 (already reads as green/okra-adjacent without needing a tint):

```typescript
// CURRENT
{ emoji: "🍆", label: "Okra", color: "#4ADE80" },

// FIX
{ emoji: "🥒", label: "Okra", color: "#4ADE80" },
```
Only the emoji character changes — label and color stay the same.

---

## 2. Journal — pinned entries not floating to top

**File:** `app/(tabs)/journal.tsx`

`groupEntriesByDate()` groups entries into date buckets, then sorts those buckets purely by date string (`b[0].localeCompare(a[0])`), ignoring pinned status entirely. A pinned entry from an older day stays buried under its own old date-group instead of floating to the top. Fix by adding a pinned-priority check before the date comparison:

```typescript
function groupEntriesByDate(entries: JournalEntry[]): { date: string; entries: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => {
      const aPinned = a[1].some((e) => e.pinned) ? 1 : 0;
      const bPinned = b[1].some((e) => e.pinned) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      return b[0].localeCompare(a[0]);
    })
    .map(([date, entries]) => ({ date, entries }));
}
```
Any date-group containing a pinned entry now sorts to the top; within pinned and within unpinned groups, newest-date-first ordering is preserved exactly as before.

---

## 3. Lunar Intentions — add delete capability

**File:** `components/LunarIntentionsHistoryModal.tsx`

Sacred Intentions already supports delete (confirm-first `Alert.alert`, destructive style, trash icon) via `deleteIntentionById` in `utils/sacredIntentionsStorage.ts`. Lunar Intentions has the equivalent storage function (`deleteIntention` in `utils/intentionsStorage.ts`) but it's never wired to the UI — only an edit (pencil) icon exists per card, no delete.

**3a.** Add `Alert` to the existing `react-native` import if not already present, and import `deleteIntention`:
```typescript
import { loadAllIntentions, saveIntention, deleteIntention } from "@/utils/intentionsStorage";
```

**3b.** Add a delete handler, matching Sacred Intentions' confirm-first pattern:
```typescript
const handleDelete = (dateKey: string) => {
  Alert.alert("Delete Intention", "Remove this lunar intention permanently?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        await deleteIntention(dateFromKey(dateKey));
        setIntentions((prev) => prev.filter((i) => i.dateKey !== dateKey));
      },
    },
  ]);
};
```

**3c.** In each card's header row, add a trash icon next to the existing edit-pencil icon:
```typescript
<View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
  <Pressable onPress={() => { setEditing({ dateKey, text }); setDraft(text); }} hitSlop={8}>
    <Feather name="edit-2" size={14} color="#A78BFA" />
  </Pressable>
  <Pressable onPress={() => handleDelete(dateKey)} hitSlop={8}>
    <Feather name="trash-2" size={14} color="#EF4444" />
  </Pressable>
</View>
```
(This replaces the single edit `Pressable` currently sitting alone in the card header — the edit button's own behavior is unchanged, delete is added alongside it.)

---

## 4. Calendar — add "Jump to Date" picker

**File:** `app/(tabs)/calendar.tsx`

Currently the calendar only supports prev/next arrows, swipe, and "Today" — no way to jump to an arbitrary month/year. Add a tappable header title that opens a lightweight Year + Month picker modal, matching the existing `modalBackdrop`/`modalCard` style already used for the Special Calendar Entry modal.

**4a.** Add state and handlers near the other calendar state declarations:
```typescript
const [jumpModalOpen, setJumpModalOpen] = useState(false);
const [jumpYear, setJumpYear] = useState(displayDate.getFullYear());

const openJumpModal = () => {
  Haptics.selectionAsync();
  setJumpYear(displayDate.getFullYear());
  setJumpModalOpen(true);
};

const handleJumpToMonth = (monthIndex: number) => {
  Haptics.selectionAsync();
  const day = Math.min(selectedDate.getDate(), new Date(jumpYear, monthIndex + 1, 0).getDate());
  const target = new Date(jumpYear, monthIndex, day);
  setDisplayDate(target);
  setSelectedDate(target);
  setJumpModalOpen(false);
};
```

**4b.** In `headerRow`, replace the plain header title `<Text>` with a tappable version:
```typescript
// CURRENT
<Text style={[styles.headerTitle, { color: colors.foreground, flex: 1, textAlign: "center" }]}>{headerTitle}</Text>

// FIX
<Pressable onPress={openJumpModal} style={{ flex: 1 }} hitSlop={8}>
  <Text style={[styles.headerTitle, { color: colors.foreground, textAlign: "center" }]}>{headerTitle}</Text>
</Pressable>
```

**4c.** Add the modal itself, alongside the existing `specialModalOpen` Modal (same file, same pattern):
```typescript
<Modal visible={jumpModalOpen} transparent animationType="slide" onRequestClose={() => setJumpModalOpen(false)}>
  <View style={styles.modalBackdrop}>
    <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Jump to Date</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 16 }}>
        <Pressable onPress={() => setJumpYear((y) => y - 1)} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>{jumpYear}</Text>
        <Pressable onPress={() => setJumpYear((y) => y + 1)} hitSlop={8}>
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {MONTH_NAMES.map((m, i) => (
          <Pressable
            key={m}
            onPress={() => handleJumpToMonth(i)}
            style={{
              width: "28%", paddingVertical: 12, borderRadius: 10,
              alignItems: "center", backgroundColor: colors.card,
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{m.slice(0, 3)}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setJumpModalOpen(false)} style={{ marginTop: 16, alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
      </Pressable>
    </View>
  </View>
</Modal>
```
Selecting a month keeps the current day-of-month where valid (e.g. jumping from the 21st of one month lands on the 21st of the target month), clamped down if the target month is shorter (e.g. the 31st clamps to the 28th/29th/30th as appropriate).

---

## VERIFICATION CHECKLIST

- [ ] Sacred Altar picker shows 🥒 for Okra, not 🍆 — color still green (`#4ADE80`)
- [ ] Journal: pinning an older entry moves its entire date group to the very top of the list, above newer unpinned entries
- [ ] Journal: unpinning an entry returns its date group to normal newest-first position
- [ ] Journal: multiple pinned entries across different dates all sort above unpinned entries, newest-pinned-first among themselves
- [ ] Lunar Intentions history: each entry now shows both an edit (pencil) icon and a delete (trash) icon
- [ ] Lunar Intentions: tapping delete shows a confirm dialog before removing anything
- [ ] Lunar Intentions: confirming delete removes the entry from the list and from storage (persists after app restart)
- [ ] Lunar Intentions: edit button still works exactly as before
- [ ] Calendar: tapping the month/year header title (e.g. "August 2026") opens the Jump to Date picker
- [ ] Calendar: year arrows in the picker step the displayed year up/down correctly
- [ ] Calendar: tapping a month jumps the calendar to that month/year, preserving the day-of-month where valid
- [ ] Calendar: jumping to a shorter month (e.g. February) from a day like the 31st clamps correctly instead of erroring
- [ ] Calendar: Cancel closes the picker without changing the displayed date
- [ ] Calendar: prev/next arrows, swipe navigation, "Today" button, and search all still work unchanged
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
