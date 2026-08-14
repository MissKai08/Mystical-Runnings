Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Note: `components/MoonWaterModal.tsx` already correctly uses `presentationStyle="pageSheet"` + `KeyboardAvoidingView` — this is NOT the transparent-Modal keyboard bug seen elsewhere in this project. The issue here is different: the Notes field sits at the bottom of a long ScrollView (after 5+ step cards), and nothing scrolls the view to bring it above the keyboard when it gains focus. Do not convert this modal's structure — only add the scroll-into-view behavior described below.

---

## 1. Moon Water Ritual — Notes field gets covered by keyboard

**File:** `components/MoonWaterModal.tsx`

Add a ref for the ritual tab's ScrollView. Find:
```typescript
  const [tab, setTab] = useState<Tab>("ritual");
  const [log, setLog] = useState<RitualLog | null>(null);
  const [history, setHistory] = useState<RitualLog[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
```
and add directly after it:
```typescript
  const ritualScrollRef = useRef<ScrollView>(null);
```

Find the ritual tab's `ScrollView` opening tag:
```tsx
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
```
replace with:
```tsx
          <ScrollView
            ref={ritualScrollRef}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
```

Find the Notes `TextInput`:
```tsx
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Record what you prepared, felt, or noticed…"
                placeholderTextColor={colors.mutedForeground}
                style={[s.notesInput, { color: colors.foreground }]}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
```
replace with:
```tsx
              <TextInput
                value={notes}
                onChangeText={setNotes}
                onFocus={() => {
                  setTimeout(() => ritualScrollRef.current?.scrollToEnd({ animated: true }), 150);
                }}
                placeholder="Record what you prepared, felt, or noticed…"
                placeholderTextColor={colors.mutedForeground}
                style={[s.notesInput, { color: colors.foreground }]}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
```
The Notes field and the two action buttons below it are the last elements in the scroll content, so scrolling to end reliably brings the field (and Save Notes button) above the keyboard. The 150ms delay lets the keyboard-open animation start before scrolling, which avoids the scroll happening before the view has resized.

---

## 2. Moon Water History — notes are read-only, add editing

**File:** `components/MoonWaterModal.tsx`

`upsertLog()` already updates an existing log by matching `id`, so no storage changes are needed — this is purely a UI addition. Add a small edit affordance to each history card that opens a focused pageSheet for editing just that entry's notes (not the step checklist, which stays locked as a record of what was actually done).

Add a new component above `// ─── Main Modal ───` (after the `HistoryCard` component and its `hc` styles, before the `PHASE_ACCENT` block):
```tsx
// ─── Edit History Notes Modal ────────────────────────────────────────────────

function EditHistoryNotesModal({
  visible,
  log,
  onClose,
  onSaved,
}: {
  visible: boolean;
  log: RitualLog | null;
  onClose: () => void;
  onSaved: (updated: RitualLog) => void;
}) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && log) setText(log.notes);
  }, [visible, log]);

  const handleSave = async () => {
    if (!log) return;
    setSaving(true);
    const updated: RitualLog = { ...log, notes: text, updatedAt: new Date().toISOString() };
    await upsertLog(updated);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved(updated);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
          <Text style={[hc.name, { color: colors.foreground, fontSize: 18, marginBottom: 4 }]}>
            Edit Notes
          </Text>
          <Text style={[hc.date, { color: colors.mutedForeground, marginBottom: 16 }]}>
            {log?.phaseName}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Record what you prepared, felt, or noticed…"
            placeholderTextColor={colors.mutedForeground}
            style={{
              color: colors.foreground,
              fontSize: 15,
              lineHeight: 22,
              minHeight: 140,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
            }}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1, borderWidth: 1, borderColor: colors.border,
                borderRadius: 12, paddingVertical: 14, alignItems: "center",
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                flex: 1, backgroundColor: "#D4A843", opacity: saving ? 0.6 : 1,
                borderRadius: 12, paddingVertical: 14, alignItems: "center",
              }}
            >
              <Text style={{ color: "#080714", fontWeight: "700" }}>
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

Update `HistoryCard` to accept an `onEdit` callback and show a pencil icon in the expanded detail section. Replace:
```tsx
function HistoryCard({ log, accent }: { log: RitualLog; accent: string }) {
```
with:
```tsx
function HistoryCard({
  log,
  accent,
  onEdit,
}: {
  log: RitualLog;
  accent: string;
  onEdit: (log: RitualLog) => void;
}) {
```

Replace:
```tsx
          {log.notes.trim() !== "" && (
            <Text style={[hc.notes, { color: colors.mutedForeground, borderLeftColor: accent + "66" }]}>
              {log.notes}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
```
with:
```tsx
          {log.notes.trim() !== "" && (
            <Text style={[hc.notes, { color: colors.mutedForeground, borderLeftColor: accent + "66" }]}>
              {log.notes}
            </Text>
          )}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); onEdit(log); }}
            style={hc.editLink}
          >
            <Feather name="edit-2" size={12} color={accent} />
            <Text style={[hc.editLinkText, { color: accent }]}>
              {log.notes.trim() !== "" ? "Edit Notes" : "Add Notes"}
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
```

Add to the `hc` stylesheet, alongside the other entries:
```typescript
  editLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  editLinkText: { fontSize: 12, fontWeight: "600" },
```

In the main `MoonWaterModal` component, add state for the edit modal near the other state:
```typescript
  const [editingLog, setEditingLog] = useState<RitualLog | null>(null);
```

Find where `HistoryCard` is rendered:
```tsx
                {history.map((item) => (
                  <HistoryCard
                    key={item.id}
                    log={item}
                    accent={PHASE_ACCENT[item.phase] ?? "#A78BFA"}
                  />
                ))}
```
replace with:
```tsx
                {history.map((item) => (
                  <HistoryCard
                    key={item.id}
                    log={item}
                    accent={PHASE_ACCENT[item.phase] ?? "#A78BFA"}
                    onEdit={setEditingLog}
                  />
                ))}
```

Render the edit modal right before the closing `</Modal>` of the main component (after the closing `</KeyboardAvoidingView>`, still inside the outer `<Modal>`... actually place it as a sibling right after the outer `</Modal>` closes, since it is its own top-level `Modal`):

Find:
```tsx
      </KeyboardAvoidingView>
    </Modal>
  );
}
```
(this is the end of the main component's return statement — the very last occurrence in the file) and replace with:
```tsx
      </KeyboardAvoidingView>
      <EditHistoryNotesModal
        visible={!!editingLog}
        log={editingLog}
        onClose={() => setEditingLog(null)}
        onSaved={(updated) => {
          setHistory((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          if (log && log.id === updated.id) {
            setLog(updated);
            setNotes(updated.notes);
          }
        }}
      />
    </Modal>
  );
}
```

---

## 3. Lunar Intentions History — add editing

**File:** `components/LunarIntentionsHistoryModal.tsx`

`saveIntention(date, text)` in `utils/intentionsStorage.ts` already overwrites by exact date key, so editing is just calling it again with the same reconstructed date. Add imports:
```typescript
import { useState, useEffect } from "react";
```
(replace the existing `import React, { useState, useEffect } from "react";` — just confirming both hooks are present, no change needed if already there.)

Add `TextInput` and `KeyboardAvoidingView` and `Platform` to the react-native import:
```typescript
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
```
becomes:
```typescript
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
```

Add the storage import:
```typescript
import { loadAllIntentions } from "@/utils/intentionsStorage";
```
becomes:
```typescript
import { loadAllIntentions, saveIntention } from "@/utils/intentionsStorage";
```

Add a helper right after `labelForDateKey` to turn a `"YYYY-MM-DD"` key back into a `Date`:
```typescript
function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
```

Add edit state inside the component, after the existing `intentions` state:
```typescript
  const [editing, setEditing] = useState<{ dateKey: string; text: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
```

Add a save handler, near the existing `useEffect`:
```typescript
  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await saveIntention(dateFromKey(editing.dateKey), draft);
    setIntentions((prev) =>
      prev.map((i) => (i.dateKey === editing.dateKey ? { ...i, text: draft.trim() } : i))
    );
    setSaving(false);
    setEditing(null);
  };
```

Add an edit pencil to each card. Replace:
```tsx
            {intentions.map(({ dateKey, text }) => (
              <View
                key={dateKey}
                style={[styles.card, { backgroundColor: colors.card, borderColor: "#7C3AED30" }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardDate, { color: "#A78BFA" }]}>
                    🌑 {labelForDateKey(dateKey)}
                  </Text>
                </View>
                <Text style={[styles.cardText, { color: colors.foreground }]}>
                  {text}
                </Text>
              </View>
            ))}
```
with:
```tsx
            {intentions.map(({ dateKey, text }) => (
              <View
                key={dateKey}
                style={[styles.card, { backgroundColor: colors.card, borderColor: "#7C3AED30" }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardDate, { color: "#A78BFA" }]}>
                    🌑 {labelForDateKey(dateKey)}
                  </Text>
                  <Pressable
                    onPress={() => { setEditing({ dateKey, text }); setDraft(text); }}
                    hitSlop={8}
                  >
                    <Feather name="edit-2" size={14} color="#A78BFA" />
                  </Pressable>
                </View>
                <Text style={[styles.cardText, { color: colors.foreground }]}>
                  {text}
                </Text>
              </View>
            ))}
```

Update the `cardHeader` style to space the date and pencil apart. Replace:
```typescript
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
```
with:
```typescript
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
```

Render the edit modal right before the closing `</Modal>` of the main component. Find:
```tsx
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
```
replace with:
```tsx
      </View>

      <Modal
        visible={!!editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            <Text style={[styles.title, { color: colors.foreground, marginBottom: 4 }]}>
              Edit Intention
            </Text>
            {editing && (
              <Text style={[styles.cardDate, { color: "#A78BFA", marginBottom: 16 }]}>
                🌑 {labelForDateKey(editing.dateKey)}
              </Text>
            )}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
              autoFocus
              style={{
                color: colors.foreground,
                fontSize: 15,
                lineHeight: 22,
                minHeight: 120,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable
                onPress={() => setEditing(null)}
                style={{
                  flex: 1, borderWidth: 1, borderColor: colors.border,
                  borderRadius: 12, paddingVertical: 14, alignItems: "center",
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={saving || !draft.trim()}
                style={{
                  flex: 1, backgroundColor: "#7C3AED", opacity: saving || !draft.trim() ? 0.6 : 1,
                  borderRadius: 12, paddingVertical: 14, alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
```

---

## VERIFICATION CHECKLIST

- [ ] Moon Water Ritual → tapping into Ritual Notes scrolls the field (and Save Notes button) above the keyboard on Android
- [ ] Notes still save correctly (Save Notes button, and auto-save on close)
- [ ] Moon Water Ritual → History tab → expanding a past entry shows an "Edit Notes" / "Add Notes" link
- [ ] Editing a past entry's notes opens a full pageSheet, keyboard doesn't cover the input, Save updates that entry in place
- [ ] Editing the notes of the log matching the *current* cycle also updates the live Today's Ritual notes field (no stale mismatch)
- [ ] Journal → Lunar Intentions → each entry shows an edit pencil next to its date
- [ ] Tapping it opens a pageSheet pre-filled with that intention's text, keyboard doesn't cover the input
- [ ] Saving an edit updates that exact date's entry (doesn't create a duplicate, doesn't shift to a different date)
- [ ] Canceling any of the new edit screens discards changes and returns to the list unchanged
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
