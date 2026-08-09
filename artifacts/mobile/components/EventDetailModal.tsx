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
