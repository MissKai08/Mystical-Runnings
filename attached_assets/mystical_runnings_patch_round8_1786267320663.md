Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status at the end.

Note: the round 7 `ScrollView` import fix (switching from `react-native` to `react-native-gesture-handler`) is confirmed correctly applied — do not touch those import lines again, they're correct as-is. This round adds the piece that was still missing.

---

## 1. Modal scroll still not working on Android — Modal renders outside GestureHandlerRootView

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`, `app/(tabs)/index.tsx` (Profile modal)

Swapping to `react-native-gesture-handler`'s `ScrollView` (round 7) was necessary but not sufficient. React Native's built-in `<Modal>` component renders its children into a **separate native window on Android** — despite how it looks nested in JSX, that content is not actually inside the app's normal view hierarchy. This means the `GestureHandlerRootView` wrapping the whole app in `app/_layout.tsx` never reaches inside a `<Modal>` at all on Android. `react-native-gesture-handler` components require a `GestureHandlerRootView` ancestor to function — without one, the gesture-handler `ScrollView` doesn't work correctly, which is exactly the remaining symptom (content still not scrolling on Android after round 7, despite the correct import).

Fix: each `<Modal>` needs its **own** `GestureHandlerRootView` wrapping its content, since the outer one can't reach it.

**`components/EventDetailModal.tsx`** — add the import, then wrap the Modal's content:

Find:
```typescript
import { ScrollView } from "react-native-gesture-handler";
```
Change to:
```typescript
import { ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";
```

Find:
```typescript
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
```
Change to:
```typescript
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable style={styles.overlay} onPress={onClose}>
```
Then find the matching closing tags at the end of the same return statement:
```typescript
      </Pressable>
    </Modal>
```
Change to:
```typescript
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
```
(Indentation on the new `GestureHandlerRootView` lines doesn't need to be perfect — just keep it a direct child of `Modal` and a direct parent of the existing `overlay` Pressable.)

**`components/OseDetailModal.tsx`** — same pattern:

Find:
```typescript
import { ScrollView } from "react-native-gesture-handler";
```
Change to:
```typescript
import { ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";
```

Find:
```typescript
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
```
Change to:
```typescript
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable style={styles.overlay} onPress={onClose}>
```
And find the matching closing tags at the end of the same return statement:
```typescript
      </Pressable>
    </Modal>
```
Change to:
```typescript
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
```

**`app/(tabs)/index.tsx`** (Profile modal only — this file's other `<Modal>` for Lunar Intention is untouched, not part of this bug report):

Find:
```typescript
import { ScrollView } from "react-native-gesture-handler";
```
Change to:
```typescript
import { ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";
```

Find (the Profile modal specifically — it's the second `<Modal>` in this file, immediately preceded by a `{/* Profile / Personalization Modal */}` comment):
```typescript
    <Modal
      visible={profileOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setProfileOpen(false)}
    >
      <Pressable style={styles.intentionOverlay} onPress={() => setProfileOpen(false)}>
```
Change to:
```typescript
    <Modal
      visible={profileOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setProfileOpen(false)}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable style={styles.intentionOverlay} onPress={() => setProfileOpen(false)}>
```
Then find this Profile modal's closing tags (the `</Modal>` that immediately follows the `{/* Profile / Personalization Modal */}` block — do not touch the earlier Lunar Intention `</Modal>`):
```typescript
      </Pressable>
    </Modal>

    {/* Profile / Personalization Modal */}
```
Leave that one (Lunar Intention) exactly as-is. Instead, find the closing of the Profile modal itself — the `</Pressable>` / `</Modal>` pair that comes right before the file's next section after the Profile modal's content ends — and change:
```typescript
      </Pressable>
    </Modal>
```
(the one closing the Profile modal specifically) to:
```typescript
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
```

Do not add `GestureHandlerRootView` to the Lunar Intention modal, `NotificationSettingsModal`, `BackupRestoreModal`, or `MoonWaterModal` — this round is scoped strictly to the three components with the confirmed scroll bug. If any of those other modals also turn out to have scroll issues, that would be a separate, explicitly-confirmed follow-up, not something to preemptively fix here.

---

## VERIFICATION CHECKLIST

- [ ] On Android in Expo Go: the Harvest Full Moon detail card (or any long full/dark moon or sabbat entry) scrolls fully, including reaching the complete Guidance text before Close
- [ ] On Android in Expo Go: Ose detail cards scroll fully
- [ ] On Android in Expo Go: Profile modal scrolls fully, First Name and both birth fields are visible, reachable, and savable
- [ ] On Android in Expo Go: tapping outside the sheet (on the dark overlay) still closes each of these three modals as before — confirm the new `GestureHandlerRootView` wrapper didn't break the existing tap-outside-to-close behavior
- [ ] On Android in Expo Go: the Close button and Save Profile / Cancel buttons still work as before
- [ ] Web preview: no regression
- [ ] Lunar Intention modal, Notification Settings modal, Backup & Restore modal, Moon Water modal: unchanged, not touched by this round
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
