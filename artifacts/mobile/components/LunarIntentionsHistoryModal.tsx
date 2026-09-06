import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useFontScale } from "@/contexts/FontScaleContext";
import { loadAllIntentions, saveIntention, deleteIntention } from "@/utils/intentionsStorage";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

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
  const { fs } = useFontScale();
  const [loading, setLoading] = useState(false);
  const [intentions, setIntentions] = useState<{ dateKey: string; text: string }[]>([]);
  const [editing, setEditing] = useState<{ dateKey: string; text: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const handleDelete = (dateKey: string) => {
    Alert.alert("Delete Intention", "Remove this lunar intention permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteIntention(dateFromKey(dateKey));
          setIntentions((prev) => prev.filter((i) => i.dateKey !== dateKey));
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await saveIntention(dateFromKey(editing.dateKey), draft);
    setIntentions((prev) =>
      prev.map((i) => (i.dateKey === editing.dateKey ? { ...i, text: draft.trim() } : i))
    );
    setSaving(false);
    setEditing(null);
  };

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
          <Text style={[styles.title, { color: colors.foreground, fontSize: fs(18) }]}>
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
            <Text style={[styles.emptyIcon, { color: colors.mutedForeground, fontSize: fs(36) }]}>🌑</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize: fs(14) }]}>
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
                  <Text style={[styles.cardDate, { color: "#A78BFA", fontSize: fs(13) }]}>
                    🌑 {labelForDateKey(dateKey)}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
                    <Pressable
                      onPress={() => { setEditing({ dateKey, text }); setDraft(text); }}
                      hitSlop={8}
                    >
                      <Feather name="edit-2" size={14} color="#A78BFA" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(dateKey)} hitSlop={8}>
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
                <Text style={[styles.cardText, { color: colors.foreground, fontSize: fs(15) }]}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={!!editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            <Text style={[styles.title, { color: colors.foreground, fontSize: fs(18), marginBottom: 4 }]}>
              Edit Intention
            </Text>
            {editing && (
              <Text style={[styles.cardDate, { color: "#A78BFA", fontSize: fs(13), marginBottom: 16 }]}>
                🌑 {labelForDateKey(editing.dateKey)}
              </Text>
            )}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
              autoFocus
              style={{
                color: colors.foreground,
                fontSize: fs(15),
                lineHeight: 22,
                minHeight: 120,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable
                onPress={() => setEditing(null)}
                style={{
                  flex: 1, borderWidth: 1, borderColor: colors.border,
                  borderRadius: 12, paddingVertical: 14, alignItems: "center",
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={saving || !draft.trim()}
                style={{
                  flex: 1, backgroundColor: "#7C3AED", opacity: saving || !draft.trim() ? 0.6 : 1,
                  borderRadius: 12, paddingVertical: 14, alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: "space-between",
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
