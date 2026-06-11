import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { exportBackup, importBackupFromJson, confirmRestore } from "@/utils/backup";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = "export" | "import";

export function BackupRestoreModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("export");
  const [loading, setLoading] = useState(false);
  const [pasteText, setPasteText] = useState("");

  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await exportBackup();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      Alert.alert("Export Failed", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!pasteText.trim()) {
      Alert.alert("No Data", "Paste your backup JSON into the field first.");
      return;
    }
    confirmRestore(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setLoading(true);
      try {
        await importBackupFromJson(pasteText.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPasteText("");
        Alert.alert(
          "✦ Restored",
          "Your data has been restored. Restart the app for all changes to take effect.",
          [{ text: "OK", onPress: onClose }]
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Restore failed.";
        Alert.alert("Restore Failed", msg);
      } finally {
        setLoading(false);
      }
    });
  }

  const s = styles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[s.container, { paddingTop: insets.top + 16 }]}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Feather name="database" size={18} color="#D4A843" />
              <Text style={s.title}>Backup & Restore</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            <Pressable
              style={[s.tab, tab === "export" && s.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab("export"); }}
            >
              <Feather
                name="upload"
                size={14}
                color={tab === "export" ? "#D4A843" : colors.mutedForeground}
              />
              <Text style={[s.tabText, tab === "export" && s.tabTextActive]}>
                Export
              </Text>
            </Pressable>
            <Pressable
              style={[s.tab, tab === "import" && s.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setTab("import"); }}
            >
              <Feather
                name="download"
                size={14}
                color={tab === "import" ? "#D4A843" : colors.mutedForeground}
              />
              <Text style={[s.tabText, tab === "import" && s.tabTextActive]}>
                Restore
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            {tab === "export" ? (
              <>
                <View style={s.infoCard}>
                  <Feather name="info" size={14} color="#D4A843" />
                  <Text style={s.infoText}>
                    Your backup includes journal entries, sacred intentions,
                    altar items, moon water logs, calendar events, streak data,
                    and all settings.
                  </Text>
                </View>

                <View style={s.cloudCard}>
                  <Text style={s.cloudTitle}>☁ Cloud & iCloud Sync</Text>
                  <Text style={s.cloudBody}>
                    After tapping Export, save the file to{" "}
                    <Text style={s.highlight}>iCloud Drive</Text> or{" "}
                    <Text style={s.highlight}>Google Drive</Text> from the share
                    sheet. It will sync across your devices and serve as your
                    cloud backup. You can also email it to yourself or AirDrop
                    it.
                  </Text>
                </View>

                <Pressable
                  style={[s.exportBtn, loading && { opacity: 0.6 }]}
                  onPress={handleExport}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D0D1A" />
                  ) : (
                    <>
                      <Feather name="share" size={18} color="#0D0D1A" />
                      <Text style={s.exportBtnText}>Export Backup</Text>
                    </>
                  )}
                </Pressable>
                <Text style={s.exportHint}>
                  Opens the native share sheet — save to Files, iCloud Drive,
                  Google Drive, email, or AirDrop.
                </Text>
              </>
            ) : (
              <>
                <View style={s.warningCard}>
                  <Feather name="alert-triangle" size={14} color="#F59E0B" />
                  <Text style={s.warningText}>
                    Restoring will overwrite all current data. This cannot be
                    undone. Make sure to export a fresh backup first.
                  </Text>
                </View>

                <View style={s.howToCard}>
                  <Text style={s.howToTitle}>How to restore</Text>
                  <Text style={s.howToStep}>
                    1. Open your backup file in any text editor or Notes app.
                  </Text>
                  <Text style={s.howToStep}>
                    2. Select all and copy the entire contents.
                  </Text>
                  <Text style={s.howToStep}>
                    3. Paste below and tap Restore.
                  </Text>
                </View>

                <Text style={s.pasteLabel}>Paste backup JSON</Text>
                <TextInput
                  style={[
                    s.pasteInput,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.card,
                    },
                  ]}
                  multiline
                  numberOfLines={6}
                  placeholder={`{ "version": 1, "appName": "Mystical Runnings", ... }`}
                  placeholderTextColor={colors.mutedForeground}
                  value={pasteText}
                  onChangeText={setPasteText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={[
                    s.restoreBtn,
                    (!pasteText.trim() || loading) && { opacity: 0.5 },
                  ]}
                  onPress={handleRestore}
                  disabled={!pasteText.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D0D1A" />
                  ) : (
                    <>
                      <Feather name="download" size={16} color="#0D0D1A" />
                      <Text style={s.restoreBtnText}>Restore Backup</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.foreground,
    },
    closeBtn: {
      padding: 4,
    },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 4,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
      gap: 3,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: "#D4A84322",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: "#D4A843",
    },
    content: {
      padding: 20,
      gap: 14,
    },
    infoCard: {
      flexDirection: "row",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      alignItems: "flex-start",
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 19,
    },
    cloudCard: {
      backgroundColor: "#1A1A2E",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#D4A84344",
      padding: 14,
      gap: 8,
    },
    cloudTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#D4A843",
    },
    cloudBody: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 19,
    },
    highlight: {
      color: "#A78BFA",
      fontWeight: "600",
    },
    exportBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#D4A843",
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 4,
    },
    exportBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#0D0D1A",
    },
    exportHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 17,
    },
    warningCard: {
      flexDirection: "row",
      gap: 10,
      backgroundColor: "#1C1300",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#F59E0B44",
      padding: 14,
      alignItems: "flex-start",
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: "#F59E0B",
      lineHeight: 19,
    },
    howToCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 6,
    },
    howToTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 2,
    },
    howToStep: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 19,
    },
    pasteLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    pasteInput: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      fontSize: 12,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      minHeight: 120,
      textAlignVertical: "top",
    },
    restoreBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#D4A843",
      borderRadius: 12,
      paddingVertical: 14,
    },
    restoreBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#0D0D1A",
    },
  });
}
