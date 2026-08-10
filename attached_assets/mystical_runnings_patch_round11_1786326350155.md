Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status at the end.

---

## 1. Fix inconsistent/random sheet heights — `enableDynamicSizing` defaults to `true` in v5

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`

Confirmed: the installed `@gorhom/bottom-sheet` version is `^5.2.14`. In v5, `enableDynamicSizing` defaults to `true` — the sheet tries to auto-size itself to its content. That doesn't work reliably when the scrollable middle section is a `BottomSheetScrollView` (used in both these components), since scrollable content height can't be measured upfront the way a plain `View`'s can. That mismatch is what's producing the inconsistent per-card heights and cropped tops — the `snapPoints` that were set are only honored when dynamic sizing is off.

Fix: explicitly disable it so the fixed `snapPoints` (80% / 88%) are actually enforced, restoring the predictable, consistent height these were supposed to have from round 9.

**`components/EventDetailModal.tsx`** — find:
```typescript
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
```
Change to:
```typescript
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
```

**`components/OseDetailModal.tsx`** — same change, find:
```typescript
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
```
Change to:
```typescript
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
```

---

## 2. Migrate the Profile modal to the same bottom-sheet pattern

**File:** `app/(tabs)/index.tsx`

This was intentionally left out of round 9 so the new pattern could be tested in isolation first. It's now confirmed working (including the round 10 reopen fix), so apply the same approach here — built correctly from the start, including the `enableDynamicSizing={false}` fix from item 1 above and the "only call `.present()`, never `.dismiss()`, from the effect" fix from round 10.

### 2a. Add imports

Find:
```typescript
import { ScrollView } from "react-native-gesture-handler";
```
Change to:
```typescript
import { ScrollView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
```

Also find:
```typescript
import React, { useMemo, useState, useEffect, useCallback } from "react";
```
Change to:
```typescript
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
```
(only add `useRef` if it isn't already imported in this file — check first; if `useRef` is already present in this import list, skip this specific change.)

### 2b. Add a ref and a present-only effect, near the existing `profileOpen` state

Find:
```typescript
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ firstName: "", birthMonth: "", birthDay: "" });
```
Change to:
```typescript
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ firstName: "", birthMonth: "", birthDay: "" });
  const profileSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (profileOpen) {
      profileSheetRef.current?.present();
    }
  }, [profileOpen]);

  const renderProfileBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.72}
        pressBehavior="close"
      />
    ),
    []
  );
```

### 2c. Update `handleSaveProfile` to close via the sheet, not via state directly

Find the end of `handleSaveProfile`:
```typescript
    setProfileOpen(false);
  }, [profileDraft]);
```
Change to:
```typescript
    profileSheetRef.current?.dismiss();
  }, [profileDraft]);
```
Leave everything else in `handleSaveProfile` (validation, `saveUserProfile`, etc.) exactly as-is — only this final line changes.

### 2d. Replace the Profile modal's JSX entirely

Find this whole block (from the `<Modal` that has `visible={profileOpen}` through its matching `</Modal>`):
```typescript
    <Modal
      visible={profileOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setProfileOpen(false)}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable style={styles.intentionOverlay} onPress={() => setProfileOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
          <Pressable
            style={[styles.intentionModalSheet, { maxHeight: screenHeight * 0.85, paddingBottom: Math.max(24, insets.bottom + 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <View style={styles.intentionModalHandle} />
              <Text style={[styles.intentionModalTitle, { color: colors.foreground }]}>👤 Your Profile</Text>
              <Text style={[styles.intentionModalSub, { color: colors.mutedForeground }]}>
                Personalize your experience. Enter your first name and birthday so the app can greet you on your special day.
              </Text>

              <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>First Name</Text>
              <TextInput
                style={[styles.intentionInput, { height: 44, marginBottom: 12 }]}
                value={profileDraft.firstName}
                onChangeText={(v) => setProfileDraft((d) => ({ ...d, firstName: v }))}
                placeholder="Your first name"
                placeholderTextColor="#6D6A8A"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={40}
              />

              <View style={styles.profileBirthRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Month (1–12)</Text>
                  <TextInput
                    style={[styles.intentionInput, { height: 44 }]}
                    value={profileDraft.birthMonth}
                    onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthMonth: v.replace(/[^0-9]/g, "") }))}
                    placeholder="e.g. 7"
                    placeholderTextColor="#6D6A8A"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Day (1–31)</Text>
                  <TextInput
                    style={[styles.intentionInput, { height: 44 }]}
                    value={profileDraft.birthDay}
                    onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthDay: v.replace(/[^0-9]/g, "") }))}
                    placeholder="e.g. 14"
                    placeholderTextColor="#6D6A8A"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={[styles.intentionModalBtns, { marginTop: 16 }]}>
              <Pressable style={styles.intentionModalCancel} onPress={() => setProfileOpen(false)}>
                <Text style={styles.intentionModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.intentionModalSave, { opacity: profileDraft.firstName.trim() ? 1 : 0.5 }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.intentionModalSaveText}>✦ Save Profile</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
```

Replace it with:
```typescript
    <BottomSheetModal
      ref={profileSheetRef}
      snapPoints={profileSnapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderProfileBackdrop}
      onDismiss={() => setProfileOpen(false)}
      backgroundStyle={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Text style={[styles.intentionModalTitle, { color: colors.foreground }]}>👤 Your Profile</Text>
        <Text style={[styles.intentionModalSub, { color: colors.mutedForeground }]}>
          Personalize your experience. Enter your first name and birthday so the app can greet you on your special day.
        </Text>
      </View>

      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>First Name</Text>
        <TextInput
          style={[styles.intentionInput, { height: 44, marginBottom: 12 }]}
          value={profileDraft.firstName}
          onChangeText={(v) => setProfileDraft((d) => ({ ...d, firstName: v }))}
          placeholder="Your first name"
          placeholderTextColor="#6D6A8A"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
        />

        <View style={styles.profileBirthRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Month (1–12)</Text>
            <TextInput
              style={[styles.intentionInput, { height: 44 }]}
              value={profileDraft.birthMonth}
              onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthMonth: v.replace(/[^0-9]/g, "") }))}
              placeholder="e.g. 7"
              placeholderTextColor="#6D6A8A"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Day (1–31)</Text>
            <TextInput
              style={[styles.intentionInput, { height: 44 }]}
              value={profileDraft.birthDay}
              onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthDay: v.replace(/[^0-9]/g, "") }))}
              placeholder="e.g. 14"
              placeholderTextColor="#6D6A8A"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
      </BottomSheetScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(24, insets.bottom + 16) }}>
        <View style={styles.intentionModalBtns}>
          <Pressable style={styles.intentionModalCancel} onPress={() => profileSheetRef.current?.dismiss()}>
            <Text style={styles.intentionModalCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.intentionModalSave, { opacity: profileDraft.firstName.trim() ? 1 : 0.5 }]}
            onPress={handleSaveProfile}
          >
            <Text style={styles.intentionModalSaveText}>✦ Save Profile</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
```

Note this replacement references `profileSnapPoints`, which doesn't exist yet — add it next to the existing `snapPoints`-style `useMemo` calls already in this file (or, if none exist yet at the top of the component, add it near where `profileSheetRef` was added in step 2b):
```typescript
  const profileSnapPoints = useMemo(() => ["60%"], []);
```

### 2e. Clean up now-unused styles (optional but tidy)

`styles.intentionOverlay` and `styles.intentionModalSheet` are still used by the *other* modal in this file (Lunar Intention) — do not remove them. `KeyboardAvoidingView` import may now be unused if the Lunar Intention modal doesn't also use it — check before removing; if it's still used elsewhere in this file, leave the import alone.

---

## Known, expected visual difference (not a bug)

Like the other two modals, the Profile sheet now opens to a fixed height (60% of screen) rather than hugging its content tightly. With three short fields this may leave some empty space below the birth day field before the keyboard appears — expected, not a bug. If the fixed height feels wrong once you see it live (too tall, too short), that's a one-line adjustment to the `"60%"` value, not a structural problem.

---

## VERIFICATION CHECKLIST

- [ ] Full moon / dark moon / sabbat detail cards: consistent height every time (no more random/cropped heights) — Lunar Eclipse, Harvest Full Moon, New Moon, and a short entry all checked
- [ ] Ose detail cards: consistent height every time
- [ ] Profile modal on Android in Expo Go: First Name and both birth fields are visible and reachable (this was the original bug — confirm it's actually fixed now, not just moved)
- [ ] Profile modal: typing in a field brings up the keyboard without the sheet or fields becoming unreachable/obscured
- [ ] Profile modal: Cancel closes it without saving
- [ ] Profile modal: entering a name (and optionally a valid birthday) and tapping Save Profile actually saves and closes
- [ ] Profile modal: close it, reopen it immediately — works every time, not sporadic (confirming it doesn't have the round 10 bug, since it was built with the fix from the start)
- [ ] Profile modal: swipe down and backdrop tap both close it correctly
- [ ] Lunar Intention modal (the other modal in this file): completely unchanged, not affected by any of this
- [ ] Web preview: no regressions across all of the above
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
