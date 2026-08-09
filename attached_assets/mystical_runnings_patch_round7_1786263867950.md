Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status at the end.

Note: backup/export is now fully confirmed working (real file content, correct timestamps, folder requirement working as designed) — do not touch anything in `utils/backup.ts` or `components/BackupRestoreModal.tsx` this round.

---

## 1. Modal ScrollView not scrolling on Android — wrong ScrollView import

**Files:** `components/EventDetailModal.tsx`, `components/OseDetailModal.tsx`, `app/(tabs)/index.tsx`

Confirmed via side-by-side testing: long modal content (e.g. the Harvest Full Moon card, the Profile modal's birth fields) displays correctly in size on both web and Android, but only actually scrolls on web — not on Android in Expo Go. Root cause: the whole app is wrapped in `GestureHandlerRootView` (`app/_layout.tsx`), which routes Android's native touch handling through `react-native-gesture-handler`'s gesture system. A plain `ScrollView` imported from `"react-native"`, nested inside two `Pressable`s inside a `Modal` (the exact structure in all three of these components), is a known combination that fails to recognize scroll gestures on Android under `GestureHandlerRootView` — the outer Pressable's tap gesture and the ScrollView's pan gesture don't negotiate correctly in that arena. Web has no such conflict, which is why it's worked there the whole time.

Fix: use the `ScrollView` from `react-native-gesture-handler` instead — a compatible drop-in replacement built to work correctly inside `GestureHandlerRootView`.

**`components/EventDetailModal.tsx`** — find:
```typescript
import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
```
Change to:
```typescript
import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
```

**`components/OseDetailModal.tsx`** — find:
```typescript
import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
```
Change to:
```typescript
import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
```

**`app/(tabs)/index.tsx`** — find:
```typescript
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Share,
  Linking,
  useWindowDimensions,
} from "react-native";
```
Change to:
```typescript
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Share,
  Linking,
  useWindowDimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
```
Note: this file has two ScrollViews (the main Today screen scroll, and the Profile modal's scroll) — both come from this one import, and both should switch together. This is expected and fine; `react-native-gesture-handler`'s ScrollView is a safe drop-in for both.

Do not change any other imports, any component logic, or any styles in these three files — this is strictly an import-source swap.

---

## VERIFICATION CHECKLIST

- [ ] On Android in Expo Go: the Harvest Full Moon detail card (or any long full/dark moon or sabbat entry) scrolls fully, including reaching the complete Guidance text before Close
- [ ] On Android in Expo Go: Ose detail cards scroll fully
- [ ] On Android in Expo Go: Profile modal scrolls fully, First Name and both birth fields are visible and reachable
- [ ] On Android in Expo Go: the main Today screen still scrolls normally (no regression from switching its ScrollView too)
- [ ] Web preview: no regression — everything that worked before still works
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
