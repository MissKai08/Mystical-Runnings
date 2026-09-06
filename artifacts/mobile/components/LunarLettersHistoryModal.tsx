import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFontScale } from "@/contexts/FontScaleContext";
import { JournalEntry } from "@/utils/journalStorage";
import { LunarLetterData } from "@/utils/lunarLetter";
import LunarLetterModal from "@/components/LunarLetterModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  visible: boolean;
  entries: JournalEntry[];
  onClose: () => void;
}

export default function LunarLettersHistoryModal({ visible, entries, onClose }: Props) {
  const colors = useColors();
  const { fs } = useFontScale();
  const [selectedLetter, setSelectedLetter] = useState<LunarLetterData | null>(null);

  const lunarLetterEntries = entries
    .filter((e) => e.isLunarLetter && e.letterMonth && e.textContent)
    .sort((a, b) => b.createdAt - a.createdAt);

  function openEntry(entry: JournalEntry) {
    if (!entry.letterMonth || !entry.textContent) return;
    const [yearStr, monthStr] = entry.letterMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const letter: LunarLetterData = {
      monthKey: entry.letterMonth,
      month,
      year,
      text: entry.textContent,
    };
    Haptics.selectionAsync();
    setSelectedLetter(letter);
  }

  function labelForEntry(entry: JournalEntry): string {
    if (!entry.letterMonth) return "Unknown";
    const [yearStr, monthStr] = entry.letterMonth.split("-");
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);
    return `${MONTH_NAMES[month] ?? "Unknown"} ${year}`;
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground, fontSize: fs(18) }]}>
              ✦ Past Lunar Letters
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {lunarLetterEntries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyIcon, { color: colors.mutedForeground, fontSize: fs(36) }]}>✦</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize: fs(14) }]}>
                No saved Lunar Letters yet.{"\n"}Open the Lunar Letter for any month and tap Save.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {lunarLetterEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: "#D4A84330" }]}
                  onPress={() => openEntry(entry)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowGlyph, { fontSize: fs(16) }]}>✦</Text>
                    <Text style={[styles.rowLabel, { color: colors.foreground, fontSize: fs(15) }]}>
                      {labelForEntry(entry)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#D4A84388" />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Open selected letter in existing LunarLetterModal */}
      <LunarLetterModal
        visible={selectedLetter !== null}
        letter={selectedLetter}
        alreadySaved
        onSave={async () => {}}
        onClose={() => setSelectedLetter(null)}
      />
    </>
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
  emptyWrap: {
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
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowGlyph: {
    fontSize: 16,
    color: "#D4A843",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
