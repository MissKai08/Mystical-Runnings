import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { loadAllIntentions } from "@/utils/intentionsStorage";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function labelForDateKey(dateKey: string): string {
  // dateKey format: "YYYY-MM-DD"
  const parts = dateKey.split("-");
  if (parts.length < 3) return dateKey;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTH_NAMES[month] ?? "Unknown";
  return `${monthName} ${day}, ${year}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LunarIntentionsHistoryModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [intentions, setIntentions] = useState<{ dateKey: string; text: string }[]>([]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    loadAllIntentions()
      .then((record) => {
        const sorted = Object.entries(record)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateKey, text]) => ({ dateKey, text }));
        setIntentions(sorted);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            🌑 Lunar Intentions
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={colors.mutedForeground} />
          </View>
        ) : intentions.length === 0 ? (
          <View style={styles.centerWrap}>
            <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>🌑</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No intentions planted yet.{"\n"}Set a Lunar Intention at each new moon.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {intentions.map(({ dateKey, text }) => (
              <View
                key={dateKey}
                style={[styles.card, { backgroundColor: colors.card, borderColor: "#7C3AED30" }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardDate, { color: "#A78BFA" }]}>
                    🌑 {labelForDateKey(dateKey)}
                  </Text>
                </View>
                <Text style={[styles.cardText, { color: colors.foreground }]}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
