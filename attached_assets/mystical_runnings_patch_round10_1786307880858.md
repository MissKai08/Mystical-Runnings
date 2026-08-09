Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. This is a small, targeted fix to the bottom-sheet logic introduced in the last round — do not touch anything else in either file, and do not touch the Profile modal (still intentionally out of scope). Report status at the end.

---

## 1. Redundant `dismiss()` call causing sporadic "can't reopen" behavior

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`

Confirmed reproducible on both Android and web preview — meaning this isn't a native-gesture-timing issue, it's a plain JS logic bug. Both components currently have:

```typescript
useEffect(() => {
  if (event) {
    sheetRef.current?.present();
  } else {
    sheetRef.current?.dismiss();
  }
}, [event]);
```
(the `OseDetailModal` version uses `group` instead of `event` — same pattern, same fix)

Every real close of the sheet — tapping the backdrop, swiping down, or tapping the Close button — is already handled internally by `BottomSheetModal` itself. Only *after* that internal close finishes does `onDismiss` fire, which is what tells the parent screen to clear `event`/`group` back to `null`. When that happens, this `useEffect` re-runs and calls `.dismiss()` a *second* time on a sheet that's already closed or mid-closing-animation. That extra, redundant call is what's leaving the sheet's internal state confused and causing it to sometimes fail to reopen.

Fix: only ever call `.present()` from this effect. Never call `.dismiss()` from it — closing is already fully handled elsewhere.

**`components/EventDetailModal.tsx`** — find:
```typescript
  useEffect(() => {
    if (event) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [event]);
```
Change to:
```typescript
  useEffect(() => {
    if (event) {
      sheetRef.current?.present();
    }
  }, [event]);
```

**`components/OseDetailModal.tsx`** — find:
```typescript
  useEffect(() => {
    if (group) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [group]);
```
Change to:
```typescript
  useEffect(() => {
    if (group) {
      sheetRef.current?.present();
    }
  }, [group]);
```

Do not change the `onDismiss={onClose}` prop, the `sheetRef.current?.dismiss()` call inside the Close button's `onPress`, or anything else in either file — those are correct as-is and are how closing already works.

---

## VERIFICATION CHECKLIST

- [ ] Open a full/dark moon or sabbat detail card, close it (via backdrop tap), immediately reopen the same card — works every time, not sporadically
- [ ] Same test via swipe-down-to-close, then reopen — works every time
- [ ] Same test via the Close button, then reopen — works every time
- [ ] Open one card, close it, open a *different* card — works every time (not sporadic)
- [ ] Same set of checks for Ose detail cards
- [ ] Confirm on both web preview and Android in Expo Go
- [ ] Scrolling within long entries (e.g. Harvest Full Moon) still works correctly — no regression from round 9
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
