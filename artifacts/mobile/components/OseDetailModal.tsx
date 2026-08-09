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
