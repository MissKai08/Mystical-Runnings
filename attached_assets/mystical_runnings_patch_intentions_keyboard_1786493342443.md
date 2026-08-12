Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Scope: one sizing tweak in `prayer.tsx`, and a keyboard fix for the three small popups inside Sacred Intentions (`Set an Intention`, `Edit Intention`, `Check In`). Do not touch the main `IntentionsModal` container itself (the outer pageSheet, header, list, Past Intentions toggle) — only the three inner mini-modal components.

---

## 1. Voice icon/label too small

**File:** `app/(tabs)/prayer.tsx`

Replace:
```tsx
<Pressable
  onPress={() => { Haptics.selectionAsync(); setVoicePickerOpen(true); }}
  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
  hitSlop={10}
>
  <Feather name="volume-2" size={16} color={colors.mutedForeground} />
  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground }}>Voice</Text>
</Pressable>
```
with:
```tsx
<Pressable
  onPress={() => { Haptics.selectionAsync(); setVoicePickerOpen(true); }}
  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
  hitSlop={10}
>
  <Feather name="volume-2" size={20} color={colors.mutedForeground} />
  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.mutedForeground }}>Voice</Text>
</Pressable>
```

---

## 2. Sacred Intentions mini-modals — keyboard covers the input on Android

**File:** `components/IntentionsModal.tsx`

Same root cause as the Lunar Intention modal fixed previously: `CheckInModal`, `AddIntentionModal`, and `EditIntentionModal` all use `transparent` + `animationType="fade"` with no keyboard handling at all — the floating-card-over-dimmed-backdrop pattern that's already been ruled out project-wide for anything with a `TextInput`. Convert all three to the same `presentationStyle="pageSheet"` + `KeyboardAvoidingView` pattern already proven working for Profile, Journal Composer, and the Lunar Intention modal.

**Note on visual change (expected, confirmed with Kai):** these three go from small floating popups to full page sheets sliding up from the bottom, matching how Profile/Journal Composer look. This is the deliberate trade-off for reliable keyboard behavior on Android.

Add to the imports at the top of the file:
```typescript
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
```
(This just adds `KeyboardAvoidingView` and `Platform` to the existing import list — don't remove or reorder anything else in it.)

### CheckInModal

Replace:
```tsx
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ci.overlay} onPress={onClose}>
        <Pressable style={[ci.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ci.title, { color: colors.foreground }]}>Check In</Text>
          <Text style={[ci.intentionPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
            "{intentionText}"
          </Text>
          <TextInput
            style={[ci.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="How is this intention unfolding…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ci.btnRow}>
            <Pressable onPress={onClose} style={[ci.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ci.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ci.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ci.saveTxt}>Save</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
```
with:
```tsx
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
          <Text style={[ci.title, { color: colors.foreground }]}>Check In</Text>
          <Text style={[ci.intentionPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
            "{intentionText}"
          </Text>
          <TextInput
            style={[ci.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="How is this intention unfolding…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ci.btnRow}>
            <Pressable onPress={onClose} style={[ci.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ci.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ci.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ci.saveTxt}>Save</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
```

### AddIntentionModal

Replace:
```tsx
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ai.overlay} onPress={onClose}>
        <Pressable style={[ai.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ai.title, { color: colors.foreground }]}>Set an Intention</Text>
          <Text style={[ai.subtitle, { color: colors.mutedForeground }]}>
            What do you wish to call into being?
          </Text>

          <TextInput
            style={[ai.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />

          <Text style={[ai.cycleLabel, { color: colors.mutedForeground }]}>Cycle</Text>
          <View style={ai.cycleRow}>
            {cycles.map((c, i) => (
              <Pressable
                key={c.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedCycle(i); }}
                style={[
                  ai.cyclePill,
                  { borderColor: selectedCycle === i ? "#D4A843" : colors.border },
                  selectedCycle === i && { backgroundColor: "#D4A84322" },
                ]}
              >
                <Text style={[ai.cyclePillMain, { color: selectedCycle === i ? "#D4A843" : colors.foreground }]}>
                  {c.name}
                </Text>
                <Text style={[ai.cyclePillSub, { color: colors.mutedForeground }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={ai.btnRow}>
            <Pressable onPress={onClose} style={[ai.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ai.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ai.saveBtn, { backgroundColor: "#7C3AED", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={ai.saveTxt}>Set Intention</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
```
with:
```tsx
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
          <Text style={[ai.title, { color: colors.foreground }]}>Set an Intention</Text>
          <Text style={[ai.subtitle, { color: colors.mutedForeground }]}>
            What do you wish to call into being?
          </Text>

          <TextInput
            style={[ai.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />

          <Text style={[ai.cycleLabel, { color: colors.mutedForeground }]}>Cycle</Text>
          <View style={ai.cycleRow}>
            {cycles.map((c, i) => (
              <Pressable
                key={c.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedCycle(i); }}
                style={[
                  ai.cyclePill,
                  { borderColor: selectedCycle === i ? "#D4A843" : colors.border },
                  selectedCycle === i && { backgroundColor: "#D4A84322" },
                ]}
              >
                <Text style={[ai.cyclePillMain, { color: selectedCycle === i ? "#D4A843" : colors.foreground }]}>
                  {c.name}
                </Text>
                <Text style={[ai.cyclePillSub, { color: colors.mutedForeground }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={ai.btnRow}>
            <Pressable onPress={onClose} style={[ai.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ai.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ai.saveBtn, { backgroundColor: "#7C3AED", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={ai.saveTxt}>Set Intention</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
```

### EditIntentionModal

Replace:
```tsx
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ei.overlay} onPress={onClose}>
        <Pressable style={[ei.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ei.title, { color: colors.foreground }]}>Edit Intention</Text>
          <TextInput
            style={[ei.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ei.btnRow}>
            <Pressable onPress={onClose} style={[ei.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ei.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ei.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ei.saveTxt}>Save Changes</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
```
with:
```tsx
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
          <Text style={[ei.title, { color: colors.foreground }]}>Edit Intention</Text>
          <TextInput
            style={[ei.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ei.btnRow}>
            <Pressable onPress={onClose} style={[ei.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ei.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ei.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ei.saveTxt}>Save Changes</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
```

Leave the `ci.overlay`, `ci.sheet`, `ai.overlay`, `ai.sheet`, `ei.overlay`, `ei.sheet` style definitions in place even though they become unused by these three blocks — do not delete them as part of this patch.

---

## VERIFICATION CHECKLIST

- [ ] Prayer screen: "Voice" icon + label are noticeably larger, still doesn't crowd the "Ifa Prayer" title
- [ ] Sacred Intentions → "+" → "Set an Intention" now opens as a full page sheet (not a floating card), text input and Cycle picker remain visible above the keyboard on Android
- [ ] Tapping an existing intention's Edit option opens as a full page sheet, keyboard doesn't cover the input
- [ ] Tapping Check-In on an intention opens as a full page sheet, keyboard doesn't cover the input
- [ ] Saving in all three still works exactly as before (writes to Sacred Intentions storage, list updates on return)
- [ ] Canceling/closing any of the three still works (via the Cancel button; swipe-down/back gesture also still closes a pageSheet as expected)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
