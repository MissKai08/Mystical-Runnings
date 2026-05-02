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

  if (!event) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: event.color + "55",
              paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 24,
            },
          ]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Category badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: event.color + "22", borderColor: event.color + "55" },
            ]}
          >
            <Text style={[styles.badgeText, { color: event.color }]}>
              {event.category}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {event.description}
            </Text>

            {/* Key/value rows */}
            {event.rows && event.rows.length > 0 && (
              <View
                style={[styles.rowsBox, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {event.rows.map((row, i) => (
                  <View
                    key={i}
                    style={[
                      styles.row,
                      i < event.rows!.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
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
            {event.guidance && (
              <View
                style={[
                  styles.guidanceBox,
                  { backgroundColor: event.color + "15", borderLeftColor: event.color },
                ]}
              >
                <Text style={[styles.guidanceLabel, { color: event.color }]}>Guidance</Text>
                <Text style={[styles.guidanceText, { color: colors.foreground }]}>
                  {event.guidance}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close */}
          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: event.color, opacity: pressed ? 0.8 : 1 },
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
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
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
    marginTop: 8,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
