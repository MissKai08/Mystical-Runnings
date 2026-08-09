Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. This round is a real architectural change to two specific files plus one shared provider setup — follow it precisely, don't improvise beyond it. Work through in order, then report status at the end.

Scope note: this round does NOT touch the Profile modal in `app/(tabs)/index.tsx`. It has the same underlying scroll bug, but is being intentionally left for a follow-up round so this change stays testable in isolation. Do not modify the Profile modal.

Also note: rounds 7 and 8 (the `react-native-gesture-handler` ScrollView import and the per-Modal `GestureHandlerRootView` wrapper) did NOT fix the underlying issue after two attempts. This round replaces that approach entirely for `EventDetailModal` and `OseDetailModal` — it does not build on top of it. The `react-native-gesture-handler` ScrollView import changes from round 7 in these two files will be removed as part of this rewrite; that's expected.

---

## 1. Install `@gorhom/bottom-sheet`

Run:
```
npx expo install @gorhom/bottom-sheet
```
Use `expo install` specifically (not plain `npm install`), so it resolves a version compatible with this project's Expo SDK (~54.0.36) and existing `react-native-reanimated` (~4.1.1) / `react-native-gesture-handler` (~2.28.0) versions.

---

## 2. Add `BottomSheetModalProvider` — required once, at the app root

**File:** `app/_layout.tsx`

Find:
```typescript
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
```
Change to:
```typescript
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardProvider } from "react-native-keyboard-controller";
```

Find:
```typescript
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  {!appReady ? (
                    <AppSplashScreen
                      fontsLoaded={fontsLoaded ?? false}
                      onComplete={() => setAppReady(true)}
                    />
                  ) : (
                    <RootLayoutNav />
                  )}
                </KeyboardProvider>
              </GestureHandlerRootView>
```
Change to:
```typescript
              <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                  <KeyboardProvider>
                    {!appReady ? (
                      <AppSplashScreen
                        fontsLoaded={fontsLoaded ?? false}
                        onComplete={() => setAppReady(true)}
                      />
                    ) : (
                      <RootLayoutNav />
                    )}
                  </KeyboardProvider>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
```
Do not change anything else in this file.

---

## 3. Replace `components/EventDetailModal.tsx` entirely

The external API (`event` prop, `onClose` prop, the `EventDetail` interface) stays identical — `app/(tabs)/index.tsx` calls this component with `<EventDetailModal event={...} onClose={...} />` in two places and needs zero changes.

Replace the entire file with:

```typescript
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export interface EventDetail {
  title: string;
  category: string;
  color: string;
  description: string;
  guidance?: string;
  rows?: { label: string; value: string }[];
}

interface Props {
  event: EventDetail | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  // Keep rendering the last event's content while the sheet plays its
  // closing animation, instead of the content vanishing the instant the
  // parent clears `event` to null.
  const lastEventRef = useRef<EventDetail | null>(null);
  if (event) lastEventRef.current = event;
  const data = event ?? lastEventRef.current;

  useEffect(() => {
    if (event) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [event]);

  const renderBackdrop = useCallback(
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

  const snapPoints = useMemo(() => ["80%"], []);

  if (!data) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: data.color + "55",
        borderBottomWidth: 0,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <View style={styles.header}>
        {/* Category badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: data.color + "22", borderColor: data.color + "55" },
          ]}
        >
          <Text style={[styles.badgeText, { color: data.color }]}>{data.category}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{data.title}</Text>
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {data.description}
        </Text>

        {/* Key/value rows */}
        {data.rows && data.rows.length > 0 && (
          <View
            style={[styles.rowsBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {data.rows.map((row, i) => (
              <View
                key={i}
                style={[
                  styles.row,
                  i < data.rows!.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Guidance */}
        {data.guidance && (
          <View
            style={[
              styles.guidanceBox,
              { backgroundColor: data.color + "15", borderLeftColor: data.color },
            ]}
          >
            <Text style={[styles.guidanceLabel, { color: data.color }]}>Guidance</Text>
            <Text style={[styles.guidanceText, { color: colors.foreground }]}>
              {data.guidance}
            </Text>
          </View>
        )}
      </BottomSheetScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: data.color, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => sheetRef.current?.dismiss()}
        >
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  rowsBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  guidanceBox: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  guidanceLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
  closeBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
```

---

## 4. Replace `components/OseDetailModal.tsx` entirely

Same principle — external API (`group` prop, `onClose` prop) stays identical, `app/(tabs)/index.tsx`'s `<OseDetailModal group={...} onClose={...} />` call needs zero changes.

Replace the entire file with:

```typescript
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { OseGroup, OSE_GROUPS } from "@/constants/spiritualData";

interface Props {
  group: OseGroup | null;
  onClose: () => void;
}

export function OseDetailModal({ group, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  const lastGroupRef = useRef<OseGroup | null>(null);
  if (group) lastGroupRef.current = group;
  const data = group ?? lastGroupRef.current;

  useEffect(() => {
    if (group) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [group]);

  const renderBackdrop = useCallback(
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

  const snapPoints = useMemo(() => ["88%"], []);

  if (!data) return null;

  const dayNum = data.dayIndex + 1;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: data.color + "55",
        borderBottomWidth: 0,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <View style={styles.header}>
        {/* Day badge */}
        <View
          style={[
            styles.dayBadge,
            { backgroundColor: data.color + "22", borderColor: data.color + "55" },
          ]}
        >
          <Text style={[styles.dayBadgeText, { color: data.color }]}>
            DAY {dayNum} OF 4 · OSE CALENDAR
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{data.name}</Text>

        {/* 4-step cycle indicator */}
        <View style={styles.cycleRow}>
          {OSE_GROUPS.map((g) => (
            <View key={g.id} style={styles.cycleCell}>
              <View
                style={[
                  styles.cyclePip,
                  {
                    backgroundColor: g.id === data.id ? g.color : colors.border,
                    transform: [{ scale: g.id === data.id ? 1.25 : 1 }],
                  },
                ]}
              />
              <Text
                style={[
                  styles.cycleLabel,
                  {
                    color: g.id === data.id ? g.color : colors.mutedForeground,
                    fontWeight: g.id === data.id ? "700" : "400",
                  },
                ]}
              >
                {g.orisas[0].split(" ")[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Orisa chips */}
        <View style={styles.orisas}>
          {data.orisas.map((o, i) => (
            <View
              key={i}
              style={[
                styles.osaChip,
                { backgroundColor: data.color + "1E", borderColor: data.color + "55" },
              ]}
            >
              <Text style={[styles.osaChipText, { color: data.color }]}>{o}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {data.description}
        </Text>

        {/* Guidance */}
        <View
          style={[
            styles.guidanceBox,
            { backgroundColor: data.color + "15", borderLeftColor: data.color },
          ]}
        >
          <Text style={[styles.guidanceTitle, { color: data.color }]}>Guidance</Text>
          <Text style={[styles.guidanceText, { color: colors.foreground }]}>
            {data.guidance}
          </Text>
        </View>

        {/* Offerings */}
        <View
          style={[
            styles.offeringsBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.offeringsTitle, { color: colors.mutedForeground }]}>
            OFFERINGS
          </Text>
          <Text style={[styles.offeringsText, { color: colors.foreground }]}>
            {data.offerings}
          </Text>
        </View>
      </BottomSheetScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: data.color, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => sheetRef.current?.dismiss()}
        >
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  dayBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  cycleRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  cycleCell: {
    alignItems: "center",
    gap: 5,
  },
  cyclePip: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cycleLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  orisas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  osaChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  osaChipText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  guidanceBox: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  guidanceTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
  offeringsBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  offeringsTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  offeringsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
```

---

## Known, expected visual difference (not a bug)

Both sheets now open to a **fixed** height (80% / 88% of screen) rather than hugging short content tightly the way the old `maxHeight`-based sheets did — e.g. a short Ose day entry will now show some empty space at the bottom of the sheet instead of ending right after the Offerings box. This is an intentional simplification to get reliable scrolling behavior first. If it looks wrong once you see it live, it can be revisited (either accepting the fixed height, or moving to `enableDynamicSizing` for closer-to-original tight sizing) — flag it either way rather than assuming it needs to match exactly.

---

## VERIFICATION CHECKLIST

- [ ] `@gorhom/bottom-sheet` installed without dependency conflicts
- [ ] On Android in Expo Go: the Harvest Full Moon detail card scrolls fully, reaching the complete Guidance text, with Close always visible at the bottom
- [ ] On Android in Expo Go: Ose detail cards scroll fully (or, for short entries like Ose Ifa, display fully with Close visible)
- [ ] On Android in Expo Go: tapping the dark backdrop closes the sheet
- [ ] On Android in Expo Go: swiping the sheet down closes it (new behavior from the library, should feel natural, not broken)
- [ ] On Android in Expo Go: the Close button closes the sheet
- [ ] Web preview: no regression, everything still displays and closes correctly
- [ ] Colors, borders, and text styling visually match the previous version as closely as possible (some empty space at the bottom of short entries is expected, see note above — that's fine)
- [ ] Profile modal: unchanged, not touched by this round, still has its known scroll bug (separate follow-up)
- [ ] No fonts, navigation, or unrelated feature behavior changed anywhere else in the app
