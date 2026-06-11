import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  exportBackup,
  importBackupFromFile,
  confirmRestore,
  getLastBackupDate,
} from "@/utils/backup";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = "export" | "import";

export function BackupRestoreModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("export");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const refreshLastBackup = useCallback(async () => {
    const d = await getLastBackupDate();
    setLastBackup(d);
  }, []);

  useEffect(() => {
    if (visible) refreshLastBackup();
  }, [visible, refreshLastBackup]);

  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      await exportBackup();
      await refreshLastBackup();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      Alert.alert("Export Failed", msg);
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    confirmRestore(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setImporting(true);
      try {
        await importBackupFromFile();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "✦ Restored",
          "Your data has been restored. Restart the app for all changes to take effect.",
          [{ text: "OK", onPress: onClose }]
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Restore failed.";
        if (msg !== "canceled") Alert.alert("Restore Failed", msg);
      } finally {
        setImporting(false);
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
            {(["export", "import"] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              >
                <Feather
                  name={t === "export" ? "upload" : "download"}
                  size={14}
                  color={tab === t ? "#D4A843" : colors.mutedForeground}
                />
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === "export" ? "Export" : "Restore"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
            {tab === "export" ? (
              <>
                <View style={s.infoCard}>
                  <Feather name="info" size={14} color="#D4A843" />
                  <Text style={s.infoText}>
                    Backs up journal entries, sacred intentions, altar items,
                    moon water logs, calendar events, streak data, and all
                    settings into a single JSON file.
                  </Text>
                </View>

                <View style={s.cloudCard}>
                  <Text style={s.cloudTitle}>☁ Cloud Sync</Text>
                  <Text style={s.cloudBody}>
                    The backup is saved to your device's Documents folder —
                    automatically included in{" "}
                    <Text style={s.highlight}>iCloud Drive</Text> on iOS and{" "}
                    <Text style={s.highlight}>Google Drive</Text> on Android.
                    The share sheet also lets you send it anywhere: Files,
                    email, or AirDrop.
                  </Text>
                </View>

                {lastBackup != null && (
                  <View style={s.lastRow}>
                    <Feather name="check-circle" size={13} color="#4ADE80" />
                    <Text style={s.lastText}>
                      Last backup: {lastBackup.toLocaleString()}
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[s.primaryBtn, exporting && s.btnDisabled]}
                  onPress={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator color="#0D0D1A" />
                  ) : (
                    <>
                      <Feather name="share" size={18} color="#0D0D1A" />
                      <Text style={s.primaryBtnText}>Export Backup</Text>
                    </>
                  )}
                </Pressable>
                <Text style={s.hint}>
                  Opens the share sheet — save to Files, iCloud Drive, Google
                  Drive, email, or AirDrop.
                </Text>
              </>
            ) : (
              <>
                <View style={s.warningCard}>
                  <Feather name="alert-triangle" size={14} color="#F59E0B" />
                  <Text style={s.warningText}>
                    Restoring will overwrite all current data. This cannot be
                    undone. Export a fresh backup first if needed.
                  </Text>
                </View>

                <View style={s.stepsCard}>
                  <Text style={s.stepsTitle}>How it works</Text>
                  <View style={s.stepRow}>
                    <Text style={s.stepNum}>1</Text>
                    <Text style={s.stepText}>
                      Tap "Choose Backup File" below.
                    </Text>
                  </View>
                  <View style={s.stepRow}>
                    <Text style={s.stepNum}>2</Text>
                    <Text style={s.stepText}>
                      Navigate to where you saved your backup — iCloud Drive,
                      Google Drive, Files, email attachment, etc.
                    </Text>
                  </View>
                  <View style={s.stepRow}>
                    <Text style={s.stepNum}>3</Text>
                    <Text style={s.stepText}>
                      Select{" "}
                      <Text style={s.mono}>mystical-runnings-backup.json</Text>{" "}
                      and your data will be restored automatically.
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[s.primaryBtn, importing && s.btnDisabled]}
                  onPress={handleImport}
                  disabled={importing}
                >
                  {importing ? (
                    <ActivityIndicator color="#0D0D1A" />
                  ) : (
                    <>
                      <Feather name="folder" size={18} color="#0D0D1A" />
                      <Text style={s.primaryBtnText}>Choose Backup File</Text>
                    </>
                  )}
                </Pressable>
                <Text style={s.hint}>
                  Opens your device file browser — navigate to iCloud Drive,
                  Google Drive, or wherever you stored the backup.
                </Text>
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
    lastRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    lastText: {
      fontSize: 12,
      color: "#4ADE80",
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#D4A843",
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 4,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#0D0D1A",
    },
    hint: {
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
    stepsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    stepsTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    stepRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    stepNum: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#D4A84322",
      textAlign: "center",
      lineHeight: 20,
      fontSize: 11,
      fontWeight: "700",
      color: "#D4A843",
      flexShrink: 0,
    },
    stepText: {
      flex: 1,
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 19,
    },
    mono: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 12,
      color: "#A78BFA",
    },
  });
}
