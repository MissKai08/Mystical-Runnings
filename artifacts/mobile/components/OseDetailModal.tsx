import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
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

  if (!group) return null;

  const dayNum = group.dayIndex + 1;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: group.color + "55",
              paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 24,
            },
          ]}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Day badge */}
          <View
            style={[
              styles.dayBadge,
              { backgroundColor: group.color + "22", borderColor: group.color + "55" },
            ]}
          >
            <Text style={[styles.dayBadgeText, { color: group.color }]}>
              DAY {dayNum} OF 4 · OSE CALENDAR
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{group.name}</Text>

          {/* 4-step cycle indicator */}
          <View style={styles.cycleRow}>
            {OSE_GROUPS.map((g) => (
              <View key={g.id} style={styles.cycleCell}>
                <View
                  style={[
                    styles.cyclePip,
                    {
                      backgroundColor: g.id === group.id ? g.color : colors.border,
                      transform: [{ scale: g.id === group.id ? 1.25 : 1 }],
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.cycleLabel,
                    {
                      color: g.id === group.id ? g.color : colors.mutedForeground,
                      fontWeight: g.id === group.id ? "700" : "400",
                    },
                  ]}
                >
                  {g.orisas[0].split(" ")[0]}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Orisa chips */}
            <View style={styles.orisas}>
              {group.orisas.map((o, i) => (
                <View
                  key={i}
                  style={[
                    styles.osaChip,
                    { backgroundColor: group.color + "1E", borderColor: group.color + "55" },
                  ]}
                >
                  <Text style={[styles.osaChipText, { color: group.color }]}>{o}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {group.description}
            </Text>

            {/* Guidance */}
            <View
              style={[
                styles.guidanceBox,
                { backgroundColor: group.color + "15", borderLeftColor: group.color },
              ]}
            >
              <Text style={[styles.guidanceTitle, { color: group.color }]}>Guidance</Text>
              <Text style={[styles.guidanceText, { color: colors.foreground }]}>
                {group.guidance}
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
                {group.offerings}
              </Text>
            </View>
          </ScrollView>

          {/* Close */}
          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: group.color, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
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
  scroll: {
    flexGrow: 0,
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
    marginTop: 4,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
