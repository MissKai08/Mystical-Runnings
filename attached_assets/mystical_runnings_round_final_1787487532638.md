Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Journal — reliable scroll-to-entry (fixes the still-broken measurement)

**File:** `app/(tabs)/journal.tsx`

The previous `getInnerViewNode()` approach doesn't reliably work on this RN/Expo version — it silently falls back to a viewport-relative measurement, landing scrollTo() at the wrong position (often near the top). Replace it with a dedicated wrapper `View` we control directly, instead of relying on any `ScrollView` internals.

**1a.** Add a new ref near the other refs in this component (alongside `scrollViewRef`, `dateGroupRefs`, etc.):
```typescript
const scrollContentRef = useRef<View>(null);
```

**1b.** Wrap ALL of the existing children currently inside `<ScrollView ref={scrollViewRef} ...> ... </ScrollView>` (the block starting at the "Search bar" comment and ending right before the closing `</ScrollView>` — this spans search bar, mood filter chips, tag chips, the Sacred Seed card, and `styles.listContent` with all date groups) in a single new `<View ref={scrollContentRef}>` wrapper:
```typescript
<ScrollView
  ref={scrollViewRef}
  style={{ flex: 1 }}
  contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  onScroll={(e) => {
    setShowBackToTop(e.nativeEvent.contentOffset.y > 400);
  }}
  scrollEventThrottle={16}
>
  <View ref={scrollContentRef}>
    {/* everything that currently lives directly inside the ScrollView stays exactly as-is here — 
        search bar, mood filter chips, tag chips, Sacred Seed card, listContent with date groups —
        just now nested one level deeper inside this wrapper View. Do not alter any of that content. */}
  </View>
</ScrollView>
```

**1c.** Replace `handleDayPress`'s measurement logic:
```typescript
// CURRENT
const handleDayPress = useCallback((date: string) => {
  const node = dateGroupRefs.current.get(date);
  const scrollNode = scrollViewRef.current;
  if (node && scrollNode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalMode("week");
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightDate(date);
    highlightTimer.current = setTimeout(() => setHighlightDate(null), 2000);
    requestAnimationFrame(() => {
      const scrollResponder = scrollViewRef.current;
      if (!scrollResponder) return;
      const innerViewNode = (scrollResponder as any).getInnerViewNode
        ? (scrollResponder as any).getInnerViewNode()
        : findNodeHandle(scrollResponder);
      if (!innerViewNode) return;
      (node as any).measureLayout(
        innerViewNode,
        (_x: number, y: number) => {
          scrollResponder.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {}
      );
    });
  }
}, [setCalMode]);

// FIX
const handleDayPress = useCallback((date: string) => {
  const node = dateGroupRefs.current.get(date);
  const scrollNode = scrollViewRef.current;
  if (node && scrollNode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalMode("week");
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightDate(date);
    highlightTimer.current = setTimeout(() => setHighlightDate(null), 2000);
    requestAnimationFrame(() => {
      const contentHandle = findNodeHandle(scrollContentRef.current);
      if (!contentHandle) return;
      (node as any).measureLayout(
        contentHandle,
        (_x: number, y: number) => {
          scrollNode.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {}
      );
    });
  }
}, [setCalMode]);
```

---

## 2. Journal — clarify the "Week" toggle label

**File:** `app/(tabs)/journal.tsx`

The Week/Month toggle's "Week" option always shows the current calendar week (it does not follow whatever date was tapped elsewhere), which reads as confusing/broken when it doesn't match a date just tapped in Month view. Relabel it to set the right expectation:

```typescript
// CURRENT
<Text style={[styles.calToggleTxt, { color: calMode === "week" ? "#D4A843" : colors.mutedForeground }]}>
  Week
</Text>

// FIX
<Text style={[styles.calToggleTxt, { color: calMode === "week" ? "#D4A843" : colors.mutedForeground }]}>
  Current Week
</Text>
```
(Only this one label changes — the "Month" label and all toggle behavior stay the same.)

---

## 3. Journal — edited-entry timestamp should show date, not just time

**File:** `app/(tabs)/journal.tsx`

An entry's "edited" stamp can land on a completely different day than the entry's own date group header, so showing only a bare time (no date) is ambiguous. This appears in TWO places in the file — both need the same fix.

```typescript
// CURRENT (appears twice — once in EntryCard, once in the entry detail sheet)
const editedTime = entry.editedAt
  ? new Date(entry.editedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  : null;

// FIX (apply to both occurrences)
const editedTime = entry.editedAt
  ? new Date(entry.editedAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  : null;
```
The line that displays it (`{time}{editedTime ? \` · edited ${editedTime}\` : ""}\`) does NOT need to change — only the `editedTime` computation itself, in both locations.

---

## 4. Calendar — search "Cancel" button is nearly unreachable

**File:** `app/(tabs)/calendar.tsx`

The `SearchBar` component's outer container has no `flex: 1`, so it grows unbounded and pushes the "Cancel" button almost entirely off the right edge of the screen, leaving only a sliver visible/tappable.

```typescript
// CURRENT
<View style={styles.searchRow}>
  <SearchBar
    value={searchQuery}
    onChangeText={setSearchQuery}
    placeholder="Search events, moons, sabbats…"
    autoFocus
  />
  <Pressable onPress={closeSearch} style={styles.cancelBtn} hitSlop={8}>
    <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
  </Pressable>
</View>

// FIX
<View style={styles.searchRow}>
  <View style={{ flex: 1 }}>
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search events, moons, sabbats…"
      autoFocus
    />
  </View>
  <Pressable onPress={closeSearch} style={styles.cancelBtn} hitSlop={8}>
    <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
  </Pressable>
</View>
```

---

## 5. Calendar — search excludes user-added Special Calendar events

**Files:** `constants/spiritualData.ts` and `app/(tabs)/calendar.tsx`

`SEARCH_INDEX` in `calendar.tsx` is a module-level constant built only from static data (Sabbats, moons, eclipses, retrogrades, etc.) — it has no access to `specialEntries` (component state holding user-added Special Calendar entries like birthdays, anniversaries, etc.), so those never appear in search results.

**5a.** Add `"special"` to the `EventType` union in `constants/spiritualData.ts`:
```typescript
export type EventType =
  | "new-moon"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full-moon"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent"
  | "dark-moon"
  | "named-moon"
  | "retrograde"
  | "ifa-prayer"
  | "ifa-festival"
  | "sabbat"
  | "solar-eclipse"
  | "lunar-eclipse"
  | "ose-day"
  | "meteor-shower"
  | "planet-opposition"
  | "planet-elongation"
  | "planet-event"
  | "solstice"
  | "equinox"
  | "special";
```

**5b.** In `app/(tabs)/calendar.tsx`, import `SPECIAL_EVENT_COLOR` (add to the existing import from `@/utils/specialCalendar`, which already imports `SpecialCalendarEntry`, `SPECIAL_CALENDAR_KEY`, `loadSpecialCalendarEntries`, `saveSpecialCalendarEntries`):
```typescript
import { SpecialCalendarEntry, SPECIAL_CALENDAR_KEY, SPECIAL_EVENT_COLOR, loadSpecialCalendarEntries, saveSpecialCalendarEntries } from "@/utils/specialCalendar";
```

**5c.** Add a combined search index that merges the static index with live special entries, and use it in place of the bare static `SEARCH_INDEX`:
```typescript
// Add near the other useMemo hooks in the component (specialEntries is already in state)
const combinedSearchIndex = useMemo(() => {
  const specialAsResults: CalSearchResult[] = specialEntries.map((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    return {
      id: `special-${e.id}`,
      name: e.title,
      date: new Date(y, m - 1, d),
      description: e.note ?? e.category,
      color: SPECIAL_EVENT_COLOR,
      type: "special" as EventType,
    };
  });
  return [...SEARCH_INDEX, ...specialAsResults].sort((a, b) => a.date.getTime() - b.date.getTime());
}, [specialEntries]);
```

```typescript
// CURRENT
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return SEARCH_INDEX;
  const q = searchQuery.toLowerCase();
  return SEARCH_INDEX.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}, [searchQuery]);

// FIX
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return combinedSearchIndex;
  const q = searchQuery.toLowerCase();
  return combinedSearchIndex.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}, [searchQuery, combinedSearchIndex]);
```

---

## VERIFICATION CHECKLIST

- [ ] Journal: tapping a date with an entry in Month view scrolls accurately to that exact entry, every time — test with a pinned entry, an unpinned entry, and with an active tag or mood filter applied
- [ ] Journal: the calendar toggle now reads "Current Week" and "Month" (not "Week" and "Month")
- [ ] Journal: editing an entry shows both a date and time for "edited" (e.g. "6:19 AM · edited Aug 23, 2026, 7:41 AM"), not just a bare time
- [ ] Journal: a brand-new (never-edited) entry still shows only its creation time, no "edited" text
- [ ] Calendar: opening search and tapping "Cancel" works reliably — the button is fully visible and easily tappable, not cut off at the screen edge
- [ ] Calendar: searching for the title or category of a user-added Special Calendar entry (e.g. a birthday) returns that entry in results
- [ ] Calendar: tapping a Special Calendar entry in search results correctly jumps to its date in Day view
- [ ] Calendar: all existing static search results (sabbats, moons, eclipses, retrogrades, festivals, astro events, Ose days) still appear and function exactly as before
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
