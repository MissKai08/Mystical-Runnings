Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

---

## Reduce "Mystical Runnings" header title size

**File:** `app/(tabs)/index.tsx`

In the `brandTitle` style (used for the "Mystical Runnings" header text), change:

```typescript
brandTitle: {
  fontSize: 42,
```

to:

```typescript
brandTitle: {
  fontSize: 38,
```

Do not change `letterSpacing`, `textAlign`, `fontFamily`, or anything else in this style block, and do not change `brandSubtitle` or any other style.

---

## VERIFICATION CHECKLIST

- [ ] "Mystical Runnings" header title on the Home screen is visibly smaller than before, still centered and legible
- [ ] No other text, spacing, or layout on the Home screen changed
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
