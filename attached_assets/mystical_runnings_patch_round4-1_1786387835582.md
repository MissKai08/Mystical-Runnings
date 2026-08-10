Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Profile modal — keyboard still covers Birth Month/Birth Day fields on Android

**File:** `app/(tabs)/index.tsx`

The Profile modal's three fields (First Name, Birth Month, Birth Day) currently use plain `TextInput` from `"react-native"`. `android_keyboardInputMode="adjustResize"` alone isn't enough because a plain `TextInput` doesn't participate in `@gorhom/bottom-sheet`'s internal keyboard-tracking/resize behavior. Fix: swap all three to `BottomSheetTextInput`, which is built for exactly this.

Add `BottomSheetTextInput` to the existing `@gorhom/bottom-sheet` import block:
```typescript
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
```

Then, inside the Profile modal only (the three `TextInput`s for First Name, Birth Month, Birth Day — do NOT touch the Lunar Intention modal's `TextInput`, that one is a plain RN `Modal` and must stay as-is), change the component tag from `TextInput` to `BottomSheetTextInput` for those three fields only. Keep every prop on each (`style`, `value`, `onChangeText`, `placeholder`, `placeholderTextColor`, `autoCapitalize`, `autoCorrect`, `maxLength`, `keyboardType`) exactly as-is — this is a component-name swap only, not a prop or logic change.

The base `TextInput` import from `"react-native"` must stay in place since the Lunar Intention modal still uses it.

---

## 2. Default font scale should be smallest, not middle

**File:** `utils/fontScale.ts`

Change:
```typescript
export const DEFAULT_SCALE_INDEX = 2;
```
to:
```typescript
export const DEFAULT_SCALE_INDEX = 0;
```
This only affects fresh installs / users who've never touched the font size setting — anyone with an existing saved `AsyncStorage` value keeps their current size, which is expected and fine.

---

## 3. "Mystical Runnings" header — investigate size/brightness

**File:** `app/(tabs)/index.tsx`, `styles.brandTitle`

Current:
```typescript
brandTitle: {
  fontSize: 46,
  letterSpacing: 0.5,
  textAlign: "center",
  fontFamily: "ZenDots_400Regular",
},
```
Run `git log -p --follow` (or equivalent blame) on this style block across recent commit history to check whether `fontSize` or the color passed at the call site (`{ color: "#D4A843" }` at the `<Text style={[styles.brandTitle, ...]}>` usage) changed recently. Report back what you find — do NOT change the value yet. If history shows no change, note that too; this may be a perception issue rather than a regression, and Kai will confirm intent before any value changes.

---

## VERIFICATION CHECKLIST

- [ ] Profile modal: tapping into Birth Month or Birth Day field on Android, the keyboard no longer covers the field — sheet resizes/scrolls to keep it visible
- [ ] Profile modal: First Name field keyboard behavior unaffected/still correct
- [ ] Lunar Intention modal keyboard behavior unaffected (still plain TextInput/RN Modal)
- [ ] Fresh install (or cleared AsyncStorage font-scale key): font size defaults to the smallest option
- [ ] Existing installs with a previously-saved font size setting are unaffected
- [ ] Report on `brandTitle` git history findings (size/color change or not)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
