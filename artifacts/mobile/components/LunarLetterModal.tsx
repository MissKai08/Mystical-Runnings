import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { LunarLetterData } from "@/utils/lunarLetter";

interface LunarLetterModalProps {
  visible: boolean;
  letter: LunarLetterData | null;
  alreadySaved: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export default function LunarLetterModal({
  visible,
  letter,
  alreadySaved,
  onSave,
  onClose,
}: LunarLetterModalProps) {
  const colors = useColors();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  if (!letter) return null;

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Lunar Letter</Text>
            <Text style={[s.headerSub, { color: "#D4A843" }]}>
              {MONTH_NAMES[letter.month]} {letter.year}
            </Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* Letter scroll */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.letterContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative top */}
          <View style={s.decorRow}>
            <View style={[s.decorLine, { backgroundColor: "#D4A84344" }]} />
            <Text style={s.decorSymbol}>✦</Text>
            <View style={[s.decorLine, { backgroundColor: "#D4A84344" }]} />
          </View>

          {/* Letter text rendered paragraph by paragraph */}
          {letter.text.split("\n").map((line, idx) => {
            const isHeading = idx === 0;
            const isBlank = line.trim() === "";
            const isOdu = line.startsWith("✦ ");
            const isIndented = line.startsWith("   ");
            const isClosing =
              line.startsWith("Ashe.") || line.startsWith("— Your Sacred Journal");
            const isIntentionQ = line.startsWith('"') && line.endsWith('"');
            const isSectionLabel =
              line === "The Odu cycling through this month carry these teachings:" ||
              line.startsWith("As this month's sacred intention");

            if (isBlank) return <View key={idx} style={s.spacer} />;

            return (
              <Text
                key={idx}
                style={[
                  s.letterLine,
                  { color: colors.foreground },
                  isHeading && [s.heading, { color: "#D4A843" }],
                  line === "Dear One," && [s.salutation, { color: colors.foreground }],
                  isOdu && [s.oduLine, { color: "#A78BFA" }],
                  isIndented && [s.oduQuote, { color: colors.mutedForeground }],
                  isSectionLabel && [s.sectionLabel, { color: colors.mutedForeground }],
                  isIntentionQ && [s.intentionQ, { color: "#D4A843" }],
                  isClosing && [s.closing, { color: colors.mutedForeground }],
                ]}
              >
                {line}
              </Text>
            );
          })}

          {/* Decorative bottom */}
          <View style={[s.decorRow, { marginTop: 24 }]}>
            <View style={[s.decorLine, { backgroundColor: "#D4A84444" }]} />
            <Text style={s.decorSymbol}>✦</Text>
            <View style={[s.decorLine, { backgroundColor: "#D4A84444" }]} />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { borderTopColor: colors.border, paddingBottom: 32 }]}>
          {alreadySaved ? (
            <View style={[s.savedBadge, { backgroundColor: "#D4A84318", borderColor: "#D4A84344" }]}>
              <Text style={[s.savedTxt, { color: "#D4A843" }]}>✦ Saved to your journal</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[s.saveBtn, { backgroundColor: "#D4A843", opacity: saving ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#080714" />
              ) : (
                <Text style={s.saveBtnTxt}>Save to Journal</Text>
              )}
            </Pressable>
          )}
          <Pressable onPress={onClose} style={s.dismissBtn}>
            <Text style={[s.dismissTxt, { color: colors.mutedForeground }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 32 },
  closeTxt: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  headerRight: { width: 32 },
  letterContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  decorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  decorLine: { flex: 1, height: 1 },
  decorSymbol: { fontSize: 14, color: "#D4A843" },
  spacer: { height: 12 },
  letterLine: {
    fontSize: 15,
    lineHeight: 24,
  },
  heading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 4,
  },
  salutation: {
    fontSize: 17,
    fontWeight: "700",
    fontStyle: "italic",
    marginTop: 4,
  },
  oduLine: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  oduQuote: {
    fontSize: 13,
    lineHeight: 21,
    fontStyle: "italic",
    paddingLeft: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 20,
  },
  intentionQ: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: "italic",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  closing: {
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: "right",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  saveBtn: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#080714",
    letterSpacing: 0.3,
  },
  savedBadge: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  savedTxt: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dismissBtn: { paddingVertical: 4 },
  dismissTxt: { fontSize: 14 },
});
