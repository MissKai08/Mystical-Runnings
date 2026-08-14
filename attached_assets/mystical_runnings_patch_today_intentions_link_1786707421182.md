Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Scope: one small addition to `app/(tabs)/index.tsx` — a "Past Intentions" link on the Today screen's Lunar Intention card, reusing the existing `LunarIntentionsHistoryModal` component (already built and in use from Journal). Do not modify `LunarIntentionsHistoryModal.tsx` itself.

---

## 1. Add "Past Intentions" link to Today's Lunar Intention card

**File:** `app/(tabs)/index.tsx`

Add the import near the other component imports:
```typescript
import MoonWaterModal from "@/components/MoonWaterModal";
```
becomes:
```typescript
import MoonWaterModal from "@/components/MoonWaterModal";
import LunarIntentionsHistoryModal from "@/components/LunarIntentionsHistoryModal";
```

Add state near the other intention-related state (`currentIntention`, `intentionModalOpen`, etc.):
```typescript
  const [pastIntentionsOpen, setPastIntentionsOpen] = useState(false);
```

Find the closing of the Lunar Intention card:
```tsx
          {!isNewMoonWindow && !isFullMoonWindow && currentIntention && (
            <>
              <Text style={[styles.intentionText, { color: colors.foreground }]}>"{currentIntention}"</Text>
              <Text style={[styles.intentionPromptSub, { color: colors.mutedForeground }]}>Active intention for this lunar cycle</Text>
            </>
          )}
        </View>
      )}
```
replace with:
```tsx
          {!isNewMoonWindow && !isFullMoonWindow && currentIntention && (
            <>
              <Text style={[styles.intentionText, { color: colors.foreground }]}>"{currentIntention}"</Text>
              <Text style={[styles.intentionPromptSub, { color: colors.mutedForeground }]}>Active intention for this lunar cycle</Text>
            </>
          )}

          <Pressable
            onPress={() => { Haptics.selectionAsync(); setPastIntentionsOpen(true); }}
            style={styles.intentionHistoryLink}
          >
            <Feather name="clock" size={11} color="#A78BFA88" />
            <Text style={[styles.intentionHistoryLinkText, { color: "#A78BFA88" }]}>Past Intentions</Text>
          </Pressable>
        </View>
      )}

      <LunarIntentionsHistoryModal
        visible={pastIntentionsOpen}
        onClose={() => setPastIntentionsOpen(false)}
      />
```

Add the matching style near `intentionEditText` (reuse the same shape as that existing style, just as its own entry):
```typescript
  intentionHistoryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  intentionHistoryLinkText: {
    fontSize: 11,
    fontWeight: "600",
  },
```

---

## VERIFICATION CHECKLIST

- [ ] Today screen's Lunar Intention card (in any of its states — prompt to plant, current intention shown, full moon reflection, or post-window) now shows a small "Past Intentions" link
- [ ] Tapping it opens the same Lunar Intentions history view already used from Journal, listing all planted intentions
- [ ] Editing an intention from that history view (existing functionality) still works and reflects correctly
- [ ] Existing "Edit intention" link and "Plant My Intention" button behavior unchanged
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
