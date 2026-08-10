Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Small, single-purpose fix — report status at the end.

---

## 1. Profile modal — keyboard covers Birth Month/Day fields on Android

**File:** `app/(tabs)/index.tsx`

Confirmed: `keyboardBehavior="interactive"` alone isn't sufficient on Android for `@gorhom/bottom-sheet` when a `TextInput` is focused inside the sheet — Android needs an explicit `android_keyboardInputMode` prop telling it to resize the sheet's layout for the keyboard, otherwise the keyboard just overlays on top of the fixed-height sheet instead of the sheet adjusting to make room. This prop is missing from the Profile modal added in round 11.

Find:
```typescript
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
```
Change to:
```typescript
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
```
This line belongs on the Profile modal's `<BottomSheetModal ref={profileSheetRef} ...>` — the one added in round 11, not `EventDetailModal` or `OseDetailModal` (which have no text inputs and don't need this).

---

## VERIFICATION CHECKLIST

- [ ] On Android in Expo Go: open Profile, tap the First Name field — keyboard appears and the field remains visible, not covered
- [ ] Tap Birth Month or Birth Day — keyboard appears and both fields remain visible/reachable, not covered
- [ ] Typing in all three fields still works correctly, values still save on "Save Profile"
- [ ] Dismissing the keyboard (tapping Done, or tapping elsewhere) returns the sheet to its normal position correctly
- [ ] No regression to the Full Moon/Ose detail cards' consistent heights from round 11
- [ ] Web preview: no regression
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
