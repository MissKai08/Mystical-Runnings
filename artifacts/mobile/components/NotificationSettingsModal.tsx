import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import {
  NotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings,
  DEFAULT_SETTINGS,
} from "@/utils/notificationSettings";
import {
  scheduleAllNotifications,
  cancelAllNotifications,
  requestPermissions,
} from "@/utils/notificationScheduler";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface TypeRow {
  key: keyof NotificationSettings["types"];
  label: string;
  description: string;
  color: string;
  emoji: string;
}

const TYPE_ROWS: TypeRow[] = [
  {
    key: "namedMoons",
    label: "Named Full Moons",
    description: "Harvest Moon, Blood Moon, Storm Moon…",
    color: "#A78BFA",
    emoji: "🌕",
  },
  {
    key: "darkMoons",
    label: "Dark Moons",
    description: "Monthly new moon / void periods",
    color: "#4C1D95",
    emoji: "🌑",
  },
  {
    key: "sabbats",
    label: "Sabbats & Solstices",
    description: "Yule, Imbolc, Ostara, Beltane…",
    color: "#34D399",
    emoji: "🌿",
  },
  {
    key: "eclipses",
    label: "Eclipses",
    description: "Solar and lunar eclipse portals",
    color: "#F59E0B",
    emoji: "🌗",
  },
  {
    key: "mercuryRetrograde",
    label: "Mercury Retrograde",
    description: "Start of each retrograde period",
    color: "#F97316",
    emoji: "☿",
  },
  {
    key: "ifaPrayerDays",
    label: "Ifa Prayer Days",
    description: "Weekly Thursday reminder (7 AM)",
    color: "#D4A843",
    emoji: "🌟",
  },
  {
    key: "ifaFestivals",
    label: "Ifa Festivals",
    description: "Osun-Osogbo, Olojo, Egungun…",
    color: "#22D3EE",
    emoji: "✨",
  },
];

const ADVANCE_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1 day before" },
  { value: 2, label: "2 days before" },
  { value: 3, label: "3 days before" },
];

export function NotificationSettingsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "ios" ? insets.top + 16 : 20;

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotificationSettings().then(setSettings);
      setSavedCount(null);
      setPermDenied(false);
    }
  }, [visible]);

  const updateSettings = (patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSavedCount(null);
  };

  const updateType = (key: keyof NotificationSettings["types"], value: boolean) => {
    Haptics.selectionAsync();
    setSettings((prev) => ({
      ...prev,
      types: { ...prev.types, [key]: value },
    }));
    setSavedCount(null);
  };

  const toggleMaster = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        setPermDenied(true);
        return;
      }
      setPermDenied(false);
    }
    updateSettings({ masterEnabled: value });
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    setSavedCount(null);
    await saveNotificationSettings(settings);
    const count = await scheduleAllNotifications(settings);
    setSavedCount(count);
    setSaving(false);
  };

  const activeTypeCount = Object.values(settings.types).filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: topPad, borderBottomColor: colors.border },
          ]}
        >
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Reminders
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Sacred event notifications
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: "#D4A843", opacity: saving ? 0.6 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#080714" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Master toggle */}
          <View
            style={[
              styles.masterCard,
              {
                backgroundColor: settings.masterEnabled
                  ? "#D4A84318"
                  : colors.card,
                borderColor: settings.masterEnabled ? "#D4A84366" : colors.border,
              },
            ]}
          >
            <View style={styles.masterLeft}>
              <Text style={[styles.masterTitle, { color: colors.foreground }]}>
                {settings.masterEnabled ? "Notifications On" : "Notifications Off"}
              </Text>
              <Text style={[styles.masterSub, { color: colors.mutedForeground }]}>
                {settings.masterEnabled
                  ? `${activeTypeCount} event type${activeTypeCount === 1 ? "" : "s"} enabled`
                  : "Tap to enable sacred event reminders"}
              </Text>
            </View>
            <Switch
              value={settings.masterEnabled}
              onValueChange={toggleMaster}
              trackColor={{ false: colors.border, true: "#D4A843" }}
              thumbColor={settings.masterEnabled ? "#080714" : colors.foreground}
            />
          </View>

          {/* Permission denied warning */}
          {permDenied && (
            <View
              style={[
                styles.warnCard,
                { backgroundColor: "#F9731622", borderColor: "#F9731655" },
              ]}
            >
              <Feather name="alert-triangle" size={14} color="#F97316" />
              <Text style={[styles.warnText, { color: "#F97316" }]}>
                Notification permission denied. Please enable it in your device
                Settings → Notifications.
              </Text>
            </View>
          )}

          {/* Saved confirmation */}
          {savedCount !== null && (
            <View
              style={[
                styles.warnCard,
                { backgroundColor: "#34D39922", borderColor: "#34D39955" },
              ]}
            >
              <Feather name="check-circle" size={14} color="#34D399" />
              <Text style={[styles.warnText, { color: "#34D399" }]}>
                {savedCount === 0
                  ? "No upcoming events to schedule."
                  : `${savedCount} reminder${savedCount === 1 ? "" : "s"} scheduled.`}
              </Text>
            </View>
          )}

          {/* Advance notice */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              NOTIFY ME
            </Text>
            <View
              style={[
                styles.segmentRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {ADVANCE_OPTIONS.map((opt) => {
                const active = settings.advanceDays === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.segmentBtn,
                      active && { backgroundColor: "#D4A843" },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateSettings({ advanceDays: opt.value });
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentLabel,
                        { color: active ? "#080714" : colors.mutedForeground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.advanceNote, { color: colors.mutedForeground }]}>
              Reminder delivered at 8:00 AM on the selected day before each event.
              Ifa Prayer Days always notify at 7:00 AM Thursday.
            </Text>
          </View>

          {/* Event type toggles */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              EVENT TYPES
            </Text>
            <View
              style={[
                styles.typeList,
                { borderColor: colors.border },
              ]}
            >
              {TYPE_ROWS.map((row, idx) => {
                const isLast = idx === TYPE_ROWS.length - 1;
                const enabled = settings.types[row.key];
                return (
                  <View
                    key={row.key}
                    style={[
                      styles.typeRow,
                      {
                        backgroundColor: colors.card,
                        borderBottomColor: isLast ? "transparent" : colors.border,
                        opacity: settings.masterEnabled ? 1 : 0.5,
                      },
                    ]}
                  >
                    <View style={[styles.typeEmoji]}>
                      <Text style={styles.typeEmojiText}>{row.emoji}</Text>
                    </View>
                    <View style={styles.typeText}>
                      <Text style={[styles.typeLabel, { color: colors.foreground }]}>
                        {row.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {row.description}
                      </Text>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={(v) => updateType(row.key, v)}
                      disabled={!settings.masterEnabled}
                      trackColor={{ false: colors.border, true: row.color + "99" }}
                      thumbColor={enabled ? row.color : colors.mutedForeground}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Footer note */}
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            Reminders are scheduled locally on your device. Press Save to apply
            changes. No account or internet required.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: { color: "#080714", fontWeight: "700", fontSize: 14 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  masterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  masterLeft: { flex: 1, gap: 3 },
  masterTitle: { fontSize: 17, fontWeight: "700" },
  masterSub: { fontSize: 13 },
  warnCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warnText: { fontSize: 13, flex: 1, lineHeight: 18 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  segmentRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentLabel: { fontSize: 12, fontWeight: "600" },
  advanceNote: {
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 2,
  },
  typeList: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  typeEmoji: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff0a",
  },
  typeEmojiText: { fontSize: 18 },
  typeText: { flex: 1, gap: 2 },
  typeLabel: { fontSize: 14, fontWeight: "600" },
  typeDesc: { fontSize: 12 },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
