Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

Context: the previous round's fix (swapping the Profile modal's `TextInput`s to `BottomSheetTextInput`) did NOT resolve the Android keyboard-covering-fields bug. This is a known, still-open upstream bug in `@gorhom/bottom-sheet` v5 (Android) — `keyboardBehavior="interactive"` + `android_keyboardInputMode="adjustResize"` does not reliably resize the sheet when a `TextInput`/`BottomSheetTextInput` is focused, even in the library's own reproduction cases. Rather than continue tuning props against an unresolved library bug, switch the Profile modal to the exact pattern already proven working on-device in `app/(tabs)/journal.tsx`'s Composer Modal (confirmed via screenshot: plain RN `Modal`, `presentationStyle="pageSheet"`, `KeyboardAvoidingView` with `behavior="height"` on Android, plain `ScrollView`/`TextInput` from `"react-native"` — keyboard does not cover the input there).

**Only touch the Profile modal.** Do NOT change `EventDetailModal.tsx` or `OseDetailModal.tsx` — those have no `TextInput`s, aren't affected by this bug, and still correctly need `BottomSheetModal` for their long-content scroll behavior. Do NOT touch the Lunar Intention modal (already a plain `Modal`, untouched, working).

---

## Profile modal — replace BottomSheetModal with Journal's proven Modal+pageSheet pattern

**File:** `app/(tabs)/index.tsx`

### Step 1 — state/refs
Remove:
```typescript
const profileSheetRef = useRef<BottomSheetModal>(null);
const profileSnapPoints = useMemo(() => ["60%"], []);

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
Keep `const [profileOpen, setProfileOpen] = useState(false);` and `const [profileDraft, ...]` exactly as-is — the Modal will now be driven directly by `profileOpen`/`setProfileOpen`, no ref needed.

### Step 2 — `handleSaveProfile`
Change the dismiss call at the end from:
```typescript
profileSheetRef.current?.dismiss();
```
to:
```typescript
setProfileOpen(false);
```

### Step 3 — JSX
Replace the entire `<BottomSheetModal ref={profileSheetRef} ...> ... </BottomSheetModal>` block (Profile modal only) with a plain `Modal` following the Composer Modal pattern from `journal.tsx`:

```tsx
{/* Profile / Personalization Modal */}
<Modal
  visible={profileOpen}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setProfileOpen(false)}
>
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: colors.background }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 16 : 20 }}>
      <Text style={[styles.intentionModalTitle, { color: colors.foreground }]}>👤 Your Profile</Text>
      <Text style={[styles.intentionModalSub, { color: colors.mutedForeground }]}>
        Personalize your experience. Enter your first name and birthday so the app can greet you on your special day.
      </Text>
    </View>

    <ScrollView
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
    </ScrollView>

    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(24, insets.bottom + 16) }}>
      <View style={styles.intentionModalBtns}>
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
    </View>
  </KeyboardAvoidingView>
</Modal>
```

Important: this uses the plain `ScrollView` and `TextInput` already imported from `"react-native"` at the top of the file (do NOT import the gesture-handler `ScrollView` for this block — Journal's working version uses the plain RN one). `BottomSheetTextInput` becomes unused after this change — if no other component in this file still uses it, remove it from the `@gorhom/bottom-sheet` import block; otherwise leave the import block as-is.

### Step 4 — cleanup check
After the change, confirm `BottomSheetBackdrop`, `BottomSheetBackdropProps`, and `profileSheetRef`/`profileSnapPoints` have no remaining references anywhere else in the file (they may still be used by other modals — only remove what's actually now unused).

---

## VERIFICATION CHECKLIST

- [ ] Profile modal: tapping into Birth Month or Birth Day field on Android, the keyboard does not cover the field — matches the working behavior already seen in Journal's New Entry composer
- [ ] Profile modal: First Name field keyboard behavior correct
- [ ] Profile modal: Cancel button closes without saving
- [ ] Profile modal: Save with name only works, no birthday required
- [ ] Profile modal: Save with name + valid birthday works and still triggers the birthday message
- [ ] EventDetailModal and OseDetailModal unchanged, still using BottomSheetModal, still scroll correctly
- [ ] Lunar Intention modal unchanged
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
