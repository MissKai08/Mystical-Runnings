Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: this is a fresh feature round, not bug fixes — no prior items are being re-touched except item 4 (Lunar Intention modal, keyboard bug only). Do not touch `EventDetailModal.tsx`, `OseDetailModal.tsx`, the Profile modal, `IntentionsModal.tsx` (Sacred Intentions), `sacredIntentionsStorage.ts`, or `intentionsStorage.ts`'s existing functions — all confirmed working, out of scope.

---

## 1. Lunar Letter history view

**Files:** new `components/LunarLettersHistoryModal.tsx`, edit `app/(tabs)/journal.tsx`

Saved Lunar Letters already live as normal journal entries (`isLunarLetter: true`, `letterMonth: "YYYY-MM"`, `textContent` holding the full generated letter text). There is currently no way to browse them as a set — only the current month can be opened via the gold "Lunar Letter — [Month Year]" button, and past ones are only findable by scrolling the general entry feed.

Add a small "Past Letters" affordance to the existing Lunar Letter button row, and a new modal that lists all saved letters and reopens any of them using the **existing** `LunarLetterModal` component (do not modify `LunarLetterModal.tsx` or `utils/lunarLetter.ts`).

**New file `components/LunarLettersHistoryModal.tsx`:**
```tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { JournalEntry } from "@/utils/journalStorage";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  visible: boolean;
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
  onClose: () => void;
}

export default function LunarLettersHistoryModal({ visible, entries, onSelect, onClose }: Props) {
  const colors = useColors();

  const letters = entries
    .filter((e) => e.isLunarLetter && e.letterMonth)
    .sort((a, b) => (b.letterMonth ?? "").localeCompare(a.letterMonth ?? ""));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Lunar Letters</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {letters.length === 0 ? (
            <View style={[s.emptyState, { borderColor: colors.border }]}>
              <Text style={s.emptyGlyph}>✦</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No letters saved yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                Open this month's Lunar Letter and tap "Save to Journal" to begin your archive.
              </Text>
            </View>
          ) : (
            letters.map((entry) => {
              const [y, m] = (entry.letterMonth ?? "").split("-").map(Number);
              const label = `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => onSelect(entry)}
                  style={[s.row, { backgroundColor: colors.card, borderColor: "#D4A84344" }]}
                >
                  <Text style={s.rowGlyph}>✦</Text>
                  <Text style={[s.rowLabel, { color: colors.foreground }]}>{label}</Text>
                  <Feather name="chevron-right" size={16} color="#D4A84388" />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  closeBtn: { width: 32 },
  closeTxt: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerRight: { width: 32 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  emptyState: {
    borderRadius: 16, borderWidth: 1, borderStyle: "dashed",
    padding: 28, alignItems: "center", gap: 10, marginTop: 20,
  },
  emptyGlyph: { fontSize: 28, color: "#D4A843" },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  rowGlyph: { fontSize: 14, color: "#D4A843" },
  rowLabel: { fontSize: 15, fontWeight: "600", flex: 1 },
});
```

**Edit `app/(tabs)/journal.tsx`:**

Import the new modal and add state near the existing `lunarLetterOpen`/`lunarLetterData` state:
```tsx
import LunarLettersHistoryModal from "@/components/LunarLettersHistoryModal";
```
```tsx
const [lunarLettersHistoryOpen, setLunarLettersHistoryOpen] = useState(false);
```

Add a small history trigger next to the existing Lunar Letter button (a chevron/link, not a full second button — keep it compact). Directly after the closing `</Pressable>` of the existing "Lunar Letter button" block (the one with `onPress={handleOpenLunarLetter}`), insert:
```tsx
<Pressable
  onPress={() => { Haptics.selectionAsync(); setLunarLettersHistoryOpen(true); }}
  style={styles.lunarLetterHistoryLink}
>
  <Feather name="clock" size={11} color="#D4A84388" />
  <Text style={[styles.lunarLetterHistoryLinkText, { color: "#D4A84388" }]}>Past Letters</Text>
</Pressable>
```

Add the matching style near `lunarLetterBtnText`:
```tsx
lunarLetterHistoryLink: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  alignSelf: "flex-end",
  paddingVertical: 4,
  paddingHorizontal: 2,
},
lunarLetterHistoryLinkText: {
  fontSize: 11,
  fontWeight: "600",
},
```

Render the modal near the existing `<LunarLetterModal ... />` usage, reconstructing a `LunarLetterData`-shaped object from the selected entry so the existing read-only modal can display it:
```tsx
<LunarLettersHistoryModal
  visible={lunarLettersHistoryOpen}
  entries={entries}
  onSelect={(entry) => {
    const [y, m] = (entry.letterMonth ?? "").split("-").map(Number);
    setLunarLetterData({
      month: (m ?? 1) - 1,
      year: y ?? new Date().getFullYear(),
      text: entry.textContent ?? "",
      monthKey: entry.letterMonth ?? "",
    });
    setLunarLettersHistoryOpen(false);
    setLunarLetterOpen(true);
  }}
  onClose={() => setLunarLettersHistoryOpen(false)}
/>
```
Note: `LunarLetterModal` will show its "✦ Saved to your journal" badge automatically since `lunarLetterSaved` already checks `entries` for a matching `letterMonth` — no change needed there.

---

## 2. Lunar Intentions history view — new Journal row

**Files:** new `components/LunarIntentionsHistoryModal.tsx`, edit `app/(tabs)/journal.tsx`

`utils/intentionsStorage.ts` already has a working `loadAllIntentions()` function that has never been wired to any UI — do not modify that file. Build a read-only history view on top of it, and add a new row in Journal placed **after** the Week/Month calendar toggle and strip (not under Sacred Intentions, and leave the Week/Month strip itself untouched).

**New file `components/LunarIntentionsHistoryModal.tsx`:**
```tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import { loadAllIntentions } from "@/utils/intentionsStorage";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LunarIntentionsHistoryModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [intentions, setIntentions] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setIntentions(await loadAllIntentions());
  }, []);

  useEffect(() => { if (visible) reload(); }, [visible, reload]);

  const rows = Object.entries(intentions).sort((a, b) => b[0].localeCompare(a[0]));

  const formatDate = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Lunar Intentions</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {rows.length === 0 ? (
            <View style={[s.emptyState, { borderColor: colors.border }]}>
              <Text style={s.emptyGlyph}>🌑</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No intentions yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                Plant one from the Today screen during the next new moon window.
              </Text>
            </View>
          ) : (
            rows.map(([key, text]) => (
              <View key={key} style={[s.card, { backgroundColor: colors.card, borderColor: "#8B8FD455" }]}>
                <Text style={[s.cardDate, { color: "#A5AEE0" }]}>{formatDate(key)}</Text>
                <Text style={[s.cardText, { color: colors.foreground }]}>"{text}"</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  closeBtn: { width: 32 },
  closeTxt: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerRight: { width: 32 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyState: {
    borderRadius: 16, borderWidth: 1, borderStyle: "dashed",
    padding: 28, alignItems: "center", gap: 10, marginTop: 20,
  },
  emptyGlyph: { fontSize: 28 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  cardDate: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  cardText: { fontSize: 15, lineHeight: 23, fontStyle: "italic" },
});
```

**Edit `app/(tabs)/journal.tsx`:**

Import and add state:
```tsx
import LunarIntentionsHistoryModal from "@/components/LunarIntentionsHistoryModal";
```
```tsx
const [lunarIntentionsHistoryOpen, setLunarIntentionsHistoryOpen] = useState(false);
```

Insert a new row immediately after the calendar strip renders (right after the `calMode === "week" ? <WeekStrip .../> : <MonthHeatmap .../>` block closes, still inside the same pinned header `<View>`, before its closing tag — this is the "moon-shade" row, styled distinctly from both the gold Lunar Letter button and the violet Sacred Intentions button):
```tsx
{/* Lunar Intentions history */}
<Pressable
  onPress={() => { Haptics.selectionAsync(); setLunarIntentionsHistoryOpen(true); }}
  style={[styles.lunarLetterBtn, { backgroundColor: "#8B8FD414", borderColor: "#8B8FD444", marginTop: 12 }]}
>
  <Text style={[styles.lunarLetterBtnGlyph, { color: "#A5AEE0" }]}>🌑</Text>
  <Text style={[styles.lunarLetterBtnText, { color: "#A5AEE0" }]}>
    Lunar Intentions
  </Text>
  <Feather name="chevron-right" size={14} color="#A5AEE088" />
</Pressable>
```
This reuses the existing `styles.lunarLetterBtn`/`styles.lunarLetterBtnGlyph`/`styles.lunarLetterBtnText` styles (already defined in this file) with a distinct moon-silver/lavender color override, rather than defining new duplicate styles.

Render the modal near the other modals at the bottom of the component:
```tsx
<LunarIntentionsHistoryModal
  visible={lunarIntentionsHistoryOpen}
  onClose={() => setLunarIntentionsHistoryOpen(false)}
/>
```

---

## 3. Voice picker for prayer text-to-speech

**Files:** new `utils/voicePreference.ts`, new `components/VoicePickerModal.tsx`, edit `app/(tabs)/prayer.tsx`

Prayer TTS currently hardcodes `language: "en-NG"` with no device-voice selection — if the device has no Nigerian English voice pack installed, it silently falls back to whatever default English voice exists. Add a picker backed by `Speech.getAvailableVoicesAsync()` so the person can choose from whatever voices are actually installed on their device, persisted in AsyncStorage.

**New file `utils/voicePreference.ts`:**
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@mystical_voice_preference_v1";

export interface VoicePreference {
  identifier: string | null; // null = use default en-NG language fallback
  language: string;
}

const DEFAULT_PREF: VoicePreference = { identifier: null, language: "en-NG" };

export async function loadVoicePreference(): Promise<VoicePreference> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PREF;
  } catch {
    return DEFAULT_PREF;
  }
}

export async function saveVoicePreference(pref: VoicePreference): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(pref));
}
```

**New file `components/VoicePickerModal.tsx`:**
```tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import * as Speech from "expo-speech";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { loadVoicePreference, saveVoicePreference, VoicePreference } from "@/utils/voicePreference";

interface Props {
  visible: boolean;
  onClose: () => void;
  onChange: (pref: VoicePreference) => void;
}

export default function VoicePickerModal({ visible, onClose, onChange }: Props) {
  const colors = useColors();
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [available, pref] = await Promise.all([
      Speech.getAvailableVoicesAsync(),
      loadVoicePreference(),
    ]);
    setVoices(available.filter((v) => v.language?.toLowerCase().startsWith("en")));
    setSelected(pref.identifier);
    setLoading(false);
  }, []);

  useEffect(() => { if (visible) load(); }, [visible, load]);

  const handleSelect = async (identifier: string | null, language: string) => {
    const pref: VoicePreference = { identifier, language };
    await saveVoicePreference(pref);
    setSelected(identifier);
    onChange(pref);
    Speech.stop();
    Speech.speak("This is how I will sound.", {
      language,
      voice: identifier ?? undefined,
      pitch: 0.85,
      rate: 0.65,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Prayer Voice</Text>
          <View style={s.headerRight} />
        </View>

        {loading ? (
          <View style={s.loadingWrap}><ActivityIndicator color="#D4A843" /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>
              Voices come from your device's text-to-speech engine. Tap one to preview it.
              Only voices actually installed on this phone will appear here.
            </Text>

            <Pressable
              onPress={() => handleSelect(null, "en-NG")}
              style={[
                s.row,
                { backgroundColor: colors.card, borderColor: selected === null ? "#D4A843" : "#2D1F5E" },
              ]}
            >
              <Text style={[s.rowLabel, { color: colors.foreground }]}>Default (en-NG)</Text>
              {selected === null && <Feather name="check" size={16} color="#D4A843" />}
            </Pressable>

            {voices.map((v) => (
              <Pressable
                key={v.identifier}
                onPress={() => handleSelect(v.identifier, v.language)}
                style={[
                  s.row,
                  { backgroundColor: colors.card, borderColor: selected === v.identifier ? "#D4A843" : "#2D1F5E" },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowLabel, { color: colors.foreground }]}>{v.name ?? v.identifier}</Text>
                  <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{v.language}</Text>
                </View>
                {selected === v.identifier && <Feather name="check" size={16} color="#D4A843" />}
              </Pressable>
            ))}

            {voices.length === 0 && (
              <Text style={[s.emptyNote, { color: colors.mutedForeground }]}>
                No additional English voices found on this device besides the system default.
                Check Settings → Text-to-speech on your phone to install more.
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  closeBtn: { width: 32 },
  closeTxt: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerRight: { width: 32 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  hint: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13,
  },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 11, marginTop: 2 },
  emptyNote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 12 },
});
```

**Edit `app/(tabs)/prayer.tsx`:**

Replace the module-level `speak()` function so it reads the stored preference instead of hardcoding `en-NG`:
```typescript
import { loadVoicePreference } from "@/utils/voicePreference";

async function speak(text: string) {
  const pref = await loadVoicePreference();
  Speech.stop();
  Speech.speak(text, {
    language: pref.language,
    voice: pref.identifier ?? undefined,
    pitch: 0.85,
    rate: 0.65,
  });
}
```
Note: `speak()` becomes async — its callers just fire-and-forget already (`onPress={() => speak(...)}`), so no caller changes are needed, but confirm no caller does `await speak(...)` expecting a return value; if any does, remove the `await` since nothing is returned.

Add an icon button somewhere in the existing prayer screen header (near wherever the tab title/controls already are) to open the picker, plus local state:
```tsx
import VoicePickerModal from "@/components/VoicePickerModal";
```
```tsx
const [voicePickerOpen, setVoicePickerOpen] = useState(false);
```
```tsx
<Pressable onPress={() => setVoicePickerOpen(true)} hitSlop={10}>
  <Feather name="volume-2" size={18} color={colors.mutedForeground} />
</Pressable>
```
Place this icon in whatever header row already exists in `prayer.tsx` (do not create a new header bar — attach it to the existing one, styled to match its other icons/buttons). Render the modal near the screen's other modals:
```tsx
<VoicePickerModal
  visible={voicePickerOpen}
  onClose={() => setVoicePickerOpen(false)}
  onChange={() => {}}
/>
```

---

## 4. Lunar Intention modal — keyboard covers the input on Android

**File:** `app/(tabs)/index.tsx`

The Lunar Intention modal (opened via "🌱 Plant My Intention" / "Edit intention" on the Today screen) still uses the old transparent-overlay + bottom-anchored-sheet pattern that was already ruled out for the Profile modal this project — it does not resize reliably against the Android keyboard. Convert it to the same `pageSheet` + `KeyboardAvoidingView` pattern already proven working for the Profile modal in this same file.

Replace the entire "Lunar Intention Modal" block:
```tsx
{/* Lunar Intention Modal */}
<Modal
  visible={intentionModalOpen}
  transparent
  animationType="slide"
  onRequestClose={() => setIntentionModalOpen(false)}
>
  <Pressable style={styles.intentionOverlay} onPress={() => setIntentionModalOpen(false)}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ width: "100%" }}
    >
      <Pressable
        style={[styles.intentionModalSheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={styles.intentionModalHandle} />
        <Text style={styles.intentionModalTitle}>🌑 Lunar Intention</Text>
        <Text style={styles.intentionModalSub}>
          Speak what you wish to call into being this lunar cycle.
        </Text>
        <TextInput
          style={styles.intentionInput}
          value={intentionDraft}
          onChangeText={setIntentionDraft}
          placeholder="Write your intention here..."
          placeholderTextColor="#6D6A8A"
          multiline
          autoFocus
          maxLength={300}
        />
        <Text style={styles.intentionCharCount}>{intentionDraft.length}/300</Text>
        <View style={styles.intentionModalBtns}>
          <Pressable
            style={styles.intentionModalCancel}
            onPress={() => setIntentionModalOpen(false)}
          >
            <Text style={styles.intentionModalCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.intentionModalSave, { opacity: intentionDraft.trim() ? 1 : 0.5 }]}
            onPress={async () => {
              if (lastNewMoonDate && intentionDraft.trim()) {
                await saveIntention(lastNewMoonDate, intentionDraft.trim());
                setCurrentIntention(intentionDraft.trim());
                setIntentionModalOpen(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          >
            <Text style={styles.intentionModalSaveText}>✦ Plant Intention</Text>
          </Pressable>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  </Pressable>
</Modal>
```
with:
```tsx
{/* Lunar Intention Modal */}
<Modal
  visible={intentionModalOpen}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setIntentionModalOpen(false)}
>
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: "#0F0C24" }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 24, paddingBottom: Math.max(24, insets.bottom + 16) }}
    >
      <Text style={styles.intentionModalTitle}>🌑 Lunar Intention</Text>
      <Text style={styles.intentionModalSub}>
        Speak what you wish to call into being this lunar cycle.
      </Text>
      <TextInput
        style={styles.intentionInput}
        value={intentionDraft}
        onChangeText={setIntentionDraft}
        placeholder="Write your intention here..."
        placeholderTextColor="#6D6A8A"
        multiline
        autoFocus
        maxLength={300}
      />
      <Text style={styles.intentionCharCount}>{intentionDraft.length}/300</Text>
      <View style={styles.intentionModalBtns}>
        <Pressable
          style={styles.intentionModalCancel}
          onPress={() => setIntentionModalOpen(false)}
        >
          <Text style={styles.intentionModalCancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.intentionModalSave, { opacity: intentionDraft.trim() ? 1 : 0.5 }]}
          onPress={async () => {
            if (lastNewMoonDate && intentionDraft.trim()) {
              await saveIntention(lastNewMoonDate, intentionDraft.trim());
              setCurrentIntention(intentionDraft.trim());
              setIntentionModalOpen(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }}
        >
          <Text style={styles.intentionModalSaveText}>✦ Plant Intention</Text>
        </Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>
```
This drops the `intentionOverlay`/`intentionModalHandle`/bottom-sheet-radius styling (the `styles.intentionModalSheet` rounded-top-only look) in favor of the same full pageSheet look the Profile modal already uses — that trade-off is expected and matches Profile's confirmed-working pattern exactly. Leave `styles.intentionOverlay` and `styles.intentionModalHandle` definitions in the stylesheet even though they become unused by this block — do not delete them, in case they're referenced elsewhere; if a lint/build step flags them as genuinely unused nowhere else in the file, it is safe to remove them at that point, but don't hunt for that as part of this patch.

---

## VERIFICATION CHECKLIST

- [ ] Today screen: "Plant My Intention" during the new moon window opens a full pageSheet modal, and the text input + Save button remain visible above the Android keyboard
- [ ] Editing an existing intention ("Edit intention" link) shows the same fixed pageSheet modal, pre-filled, keyboard doesn't cover it
- [ ] Saving an intention still works exactly as before (writes to `@mystical_lunar_intentions`, updates the Today card)
- [ ] Journal: "Past Letters" link appears next to the Lunar Letter button; tapping it lists all saved letters by month, newest first
- [ ] Tapping a past letter in that list opens it in the normal Lunar Letter reader, showing "✦ Saved to your journal"
- [ ] Journal: with zero saved letters, "Past Letters" shows the empty state, not a blank screen or crash
- [ ] Journal: new "Lunar Intentions" row appears directly after the Week/Month calendar section, styled in the moon-silver/lavender color, distinct from the gold Lunar Letter and violet Sacred Intentions rows above it
- [ ] Tapping "Lunar Intentions" lists every planted intention across all cycles, newest first, with its date
- [ ] With zero lunar intentions ever planted, that view shows its empty state, not a blank screen
- [ ] Week/Month calendar strip itself is completely unchanged — no new dots, no new markers
- [ ] Sacred Intentions button/modal is completely unchanged
- [ ] Prayer screen has a new small speaker/volume icon that opens a voice picker
- [ ] Voice picker lists actual voices installed on the test device (via `Speech.getAvailableVoicesAsync()`), not a hardcoded list
- [ ] Tapping a voice in the picker plays a short preview in that voice
- [ ] Selecting a voice persists — closing and reopening the app still uses the chosen voice for prayer playback
- [ ] "Default (en-NG)" option still works if no specific voice is chosen
- [ ] No fonts, colors (outside the specified new moon-shade accent), navigation, or unrelated feature behavior changed anywhere else in the app
