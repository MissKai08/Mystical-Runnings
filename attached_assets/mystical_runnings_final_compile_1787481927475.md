Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: Sacred Altar Okra swap, the pinned-journal-entries sort fix, Lunar Intentions delete, Jump to Date, the notifications-after-restore fix, the basic Week-view auto-switch-on-tap, the Lunar Intentions reposition (under Sacred Intentions), the Voice Picker "Default" preview, and the Resources alphabetical sort are all already live and confirmed working — do not touch any of that. This patch builds on top of the current live code.

---

## 1. Journal — accurate scroll-to-entry (replaces the offset-caching approach)

**File:** `app/(tabs)/journal.tsx`

The Week-view auto-switch (already live) helps, but tapping a date still doesn't reliably scroll to the *correct* entry. Root cause: `offsetMap` caches each date group's `y` position relative to its immediate parent (`listContent`), but `scrollTo()` needs a position relative to the whole scrollable content — which also includes the search bar and mood-filter strip sitting above `listContent`. Those aren't accounted for, so every cached offset is short by their combined height, and gets worse the more filter chips/pinned entries shift things around.

Replace the offset-caching approach with an accurate on-demand measurement using refs:

**1a.** Add `findNodeHandle` to the existing `react-native` import:
```typescript
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutChangeEvent,
  findNodeHandle,
} from "react-native";
```

**1b.** Replace the `offsetMap` ref with a ref map of the actual native nodes:
```typescript
// CURRENT
const offsetMap = useRef<Map<string, number>>(new Map());

// FIX
const dateGroupRefs = useRef<Map<string, View>>(new Map());
```

**1c.** Replace `handleDayPress`:
```typescript
// CURRENT
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
      const scrollHandle = findNodeHandle(scrollNode);
      if (!scrollHandle) return;
      (node as any).measureLayout(
        scrollHandle,
        (_x: number, y: number) => {
          scrollNode.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {
          // measurement failed — no-op, avoids a crash; entry is still highlighted
        }
      );
    });
  }
}, [setCalMode]);
```

**1d.** Update the date group `View` to register itself in `dateGroupRefs` instead of caching a layout offset:
```typescript
// CURRENT
<View
  key={date}
  style={[
    styles.dateGroup,
    highlightDate === date && styles.dateGroupHighlight,
  ]}
  onLayout={(e) => { offsetMap.current.set(date, e.nativeEvent.layout.y); }}
>

// FIX
<View
  key={date}
  ref={(el) => { if (el) dateGroupRefs.current.set(date, el); }}
  style={[
    styles.dateGroup,
    highlightDate === date && styles.dateGroupHighlight,
  ]}
>
```

This measures the tapped date group's real position relative to the ScrollView at the moment of the tap, so it stays accurate regardless of pinned entries, active filters, or shield/streak banners changing what's above it.

---

## 2. Journal — icon updates and button reorder

**File:** `app/(tabs)/journal.tsx`

Current live order is Lunar Letter → Sacred Intentions → Lunar Intentions. Change the icons and move Sacred Intentions to last (new order: Lunar Letter → Lunar Intentions → Sacred Intentions):

```typescript
// CURRENT
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

// FIX — reordered, icons updated
{/* Lunar Intentions history */}
<Pressable
  onPress={() => { Haptics.selectionAsync(); setLunarIntentionsHistoryOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#C4B5FD14", borderColor: "#C4B5FD44" }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#C4B5FD" }]}>✧</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#C4B5FD" }]}>
    Lunar Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#C4B5FD88" />
</Pressable>

{/* Sacred Intentions button */}
<Pressable
  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIntentionsOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#7C3AED14", borderColor: "#7C3AED44", marginTop: 8 }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#A78BFA" }]}>✨️</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#A78BFA" }]}>
    Sacred Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#A78BFA88" />
</Pressable>
```
Note the `marginTop: 8` moves from the second button to whichever button is now second in the new order (Sacred Intentions).

---

## 3. Journal — "back to top" button

**File:** `app/(tabs)/journal.tsx`

Add a floating button that appears once the list is scrolled down, positioned opposite the existing gold compose button so they don't overlap.

**3a.** Add state:
```typescript
const [showBackToTop, setShowBackToTop] = useState(false);
```

**3b.** On the main `ScrollView`, add/extend the scroll handler:
```typescript
onScroll={(e) => {
  setShowBackToTop(e.nativeEvent.contentOffset.y > 400);
}}
scrollEventThrottle={16}
```
(If the ScrollView already has an `onScroll` handler for other purposes, add this logic inside the existing one rather than adding a second `onScroll` prop.)

**3c.** Render the button (near the existing compose button, same screen-level container):
```typescript
{showBackToTop && (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }}
    style={{
      position: "absolute", left: 20, bottom: 24,
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    }}
  >
    <Feather name="arrow-up" size={20} color="#D4A843" />
  </Pressable>
)}
```

---

## 4. Journal — editing an entry unpins it and overwrites its original time

**File:** `utils/journalStorage.ts` and `app/(tabs)/journal.tsx`

Editing an existing entry currently (a) always stamps `createdAt: Date.now()`, silently changing the displayed time to the edit time instead of the original creation time, and (b) never carries forward `pinned`, so editing a pinned entry silently unpins it.

**4a.** Add an `editedAt` field to the entry type (`utils/journalStorage.ts`):
```typescript
export interface JournalEntry {
  id: string;
  date: string;
  moonPhase: string;
  spiritualContext: string[];
  inputType: "text" | "drawing";
  textContent?: string;
  drawingData?: DrawingData;
  mood?: string[];
  tags?: string[];
  isLunarLetter?: boolean;
  letterMonth?: string;
  createdAt: number;
  editedAt?: number;
  pinned?: boolean;
}
```

**4b.** Fix `handleSave()` in `app/(tabs)/journal.tsx` to preserve `createdAt` and `pinned` on edit, and stamp `editedAt` only when editing:
```typescript
// CURRENT
const handleSave = async () => {
  const hasText = inputMode === "text" && textValue.trim().length > 0;
  const hasDrawing = inputMode === "drawing" && (drawingRef.current?.getPaths() ?? []).length > 0;
  if (!hasText && !hasDrawing) {
    Alert.alert("Nothing to save", "Add some text or a drawing before saving.");
    return;
  }
  setSaving(true);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const entry: JournalEntry = {
    id: editingEntryId ?? generateId(),
    date: composerDate ?? todayKey(),
    moonPhase: entrySpiritualCtx.moonPhase,
    spiritualContext: entrySpiritualCtx.context,
    mood: selectedMoods.length > 0 ? [...selectedMoods] : undefined,
    tags: selectedTags.length > 0 ? [...selectedTags] : undefined,
    inputType: inputMode,
    textContent: inputMode === "text" ? textValue.trim() : undefined,
    drawingData:
      inputMode === "drawing"
        ? {
            paths: drawingRef.current?.getPaths() ?? [],
            width: canvasSize.width,
            height: canvasSize.height,
          }
        : undefined,
    createdAt: Date.now(),
  };
  await saveEntry(entry);
  setEntries(await loadEntries());
  setSaving(false);
  setComposerOpen(false);
  setEditingEntryId(null);
};

// FIX
const handleSave = async () => {
  const hasText = inputMode === "text" && textValue.trim().length > 0;
  const hasDrawing = inputMode === "drawing" && (drawingRef.current?.getPaths() ?? []).length > 0;
  if (!hasText && !hasDrawing) {
    Alert.alert("Nothing to save", "Add some text or a drawing before saving.");
    return;
  }
  setSaving(true);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const existingEntry = editingEntryId ? entries.find((e) => e.id === editingEntryId) : undefined;
  const entry: JournalEntry = {
    id: editingEntryId ?? generateId(),
    date: composerDate ?? todayKey(),
    moonPhase: entrySpiritualCtx.moonPhase,
    spiritualContext: entrySpiritualCtx.context,
    mood: selectedMoods.length > 0 ? [...selectedMoods] : undefined,
    tags: selectedTags.length > 0 ? [...selectedTags] : undefined,
    inputType: inputMode,
    textContent: inputMode === "text" ? textValue.trim() : undefined,
    drawingData:
      inputMode === "drawing"
        ? {
            paths: drawingRef.current?.getPaths() ?? [],
            width: canvasSize.width,
            height: canvasSize.height,
          }
        : undefined,
    createdAt: existingEntry?.createdAt ?? Date.now(),
    editedAt: existingEntry ? Date.now() : undefined,
    pinned: existingEntry?.pinned,
  };
  await saveEntry(entry);
  setEntries(await loadEntries());
  setSaving(false);
  setComposerOpen(false);
  setEditingEntryId(null);
};
```

**4c.** Display the edited time beside the original time, in both places it's rendered (`EntryCard` component and the entry detail sheet). Find each occurrence of:
```typescript
const time = new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
```
and add directly after it:
```typescript
const editedTime = entry.editedAt
  ? new Date(entry.editedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  : null;
```
Then update each corresponding time display:
```typescript
// CURRENT (both locations — EntryCard uses styles.entryTime, the detail sheet uses detailStyles.sheetTime)
<Text style={[styles.entryTime, { color: colors.mutedForeground }]}>{time}</Text>

// FIX
<Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
  {time}{editedTime ? ` · edited ${editedTime}` : ""}
</Text>
```
(Apply the equivalent change to the detail sheet's own time `<Text>`, keeping its existing `detailStyles.sheetTime` styling.)

---

## 5. Prayer — explanatory note about changing the voice

**File:** `app/(tabs)/prayer.tsx`

Add a small subtitle line under the header title/Voice row, above the tab row, so the voice-switching option is discoverable without being intrusive:

```typescript
<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
  <Text style={[styles.screenTitle, { color: colors.foreground }]}>Ifa Prayer</Text>
  <Pressable
    onPress={() => { Haptics.selectionAsync(); setVoicePickerOpen(true); }}
    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    hitSlop={10}
  >
    <Feather name="volume-2" size={20} color={colors.mutedForeground} />
    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.mutedForeground }}>Voice</Text>
  </Pressable>
</View>
<Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4, opacity: 0.8 }}>
  Not a fan of the voice reading your prayers? Tap "Voice" above to preview and choose a different one.
</Text>
```
(Insert this new `<Text>` directly after the existing title/Voice `<View>` row, before the `<View style={[styles.tabRow, ...]}>` that follows.)

---

## VERIFICATION CHECKLIST

- [ ] Journal: tapping a date with an entry (in either Week or Month view) scrolls to and clearly highlights the correct entry, every time — including when pinned entries, active tag/mood filters, or shield/streak banners are present above the list
- [ ] Journal: Lunar Intentions button now appears directly under Lunar Letter/Past Letters, with a ✧ icon
- [ ] Journal: Sacred Intentions button now appears last (below Lunar Intentions), with a ✨️ icon
- [ ] Journal: a "back to top" button appears in the bottom-left once scrolled down ~400px, and disappears near the top
- [ ] Journal: tapping "back to top" smoothly scrolls to the very top of the entry list
- [ ] Journal: editing an existing entry preserves its original creation time — the time shown does NOT change to the edit time
- [ ] Journal: editing an existing entry now shows "· edited [time]" next to the original time, both on the entry card and in the detail sheet
- [ ] Journal: editing a pinned entry keeps it pinned afterward
- [ ] Journal: creating a brand-new entry still shows only its creation time (no "edited" text, since it hasn't been edited)
- [ ] Prayer screen: a short note about changing the voice now appears under the header, above the Morning Guide/Prayers/Odu tabs
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
- [ ] Nothing from the already-live fixes (Sacred Altar Okra, pinned-sort, Lunar Intentions delete, Jump to Date, notifications-after-restore, basic Week-view switch, Lunar Intentions reposition, Voice Picker Default preview, Resources alphabetical sort) was altered or reverted
