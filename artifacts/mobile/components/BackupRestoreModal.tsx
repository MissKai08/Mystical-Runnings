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
  getLastAutoBackupDate,
  getAutoBackupFrequency,
  setAutoBackupFrequency,
  AutoBackupFrequency,
  uploadBackupToCloud,
  downloadBackupFromCloud,
  getCloudBackupDate,
} from "@/utils/backup";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = "export" | "import" | "cloud";

function formatDate(d: Date | null, fallback = "Never"): string {
  if (!d) return fallback;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function nextRunLabel(freq: AutoBackupFrequency, lastAuto: Date | null): string {
  if (freq === "manual") return "Off";
  if (!lastAuto) return "Next app open";
  const ms = freq === "daily" ? 23 * 3600 * 1000 : 6 * 24 * 3600 * 1000;
  const next = new Date(lastAuto.getTime() + ms);
  if (next <= new Date()) return "Next app open";
  const diffMs = next.getTime() - Date.now();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 24) return `In ~${Math.floor(hours / 24)}d`;
  if (hours > 0) return `In ~${hours}h`;
  return `In ~${mins}m`;
}

export function BackupRestoreModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("export");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cloudUploading, setCloudUploading] = useState(false);
  const [cloudRestoring, setCloudRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [lastAutoBackup, setLastAutoBackup] = useState<Date | null>(null);
  const [cloudBackupDate, setCloudBackupDate] = useState<Date | null>(null);
  const [autoFreq, setAutoFreq] = useState<AutoBackupFrequency>("manual");

  const refreshAll = useCallback(async () => {
    const [manual, auto, cloud, freq] = await Promise.allSettled([
      getLastBackupDate(),
      getLastAutoBackupDate(),
      getCloudBackupDate(),
      getAutoBackupFrequency(),
    ]);
    if (manual.status === "fulfilled") setLastBackup(manual.value);
    if (auto.status === "fulfilled") setLastAutoBackup(auto.value);
    if (cloud.status === "fulfilled") setCloudBackupDate(cloud.value);
    if (freq.status === "fulfilled") setAutoFreq(freq.value);
  }, []);

  useEffect(() => {
    if (visible) refreshAll();
  }, [visible, refreshAll]);

  async function handleFreqChange(freq: AutoBackupFrequency) {
    Haptics.selectionAsync();
    setAutoFreq(freq);
    await setAutoBackupFrequency(freq);
  }

  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      await exportBackup();
      await refreshAll();
      if (Platform.OS !== "web") {
        Alert.alert("✦ Exported", "Your backup file has been saved.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      Alert.alert("Export Failed", msg);
    } finally {
      setExporting(false);
    }
  }

  async function handleCloudUpload() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCloudUploading(true);
    try {
      await uploadBackupToCloud();
      await refreshAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✦ Saved", "Your backup has been saved to the cloud.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      Alert.alert("Cloud Upload Failed", msg);
    } finally {
      setCloudUploading(false);
    }
  }

  function handleCloudRestore() {
    confirmRestore(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setCloudRestoring(true);
      try {
        await downloadBackupFromCloud();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "✦ Restored",
          "Your cloud backup has been restored. Restart the app for all changes to take effect.",
          [{ text: "OK", onPress: onClose }]
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Restore failed.";
        Alert.alert("Cloud Restore Failed", msg);
      } finally {
        setCloudRestoring(false);
      }
    });
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

  const sheetContent = (
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

      {/* Status strip */}
      <View style={s.statusStrip}>
        <View style={s.statusItem}>
          <Text style={s.statusLabel}>Manual export</Text>
          <Text style={s.statusValue}>{formatDate(lastBackup)}</Text>
        </View>
        <View style={s.statusDivider} />
        <View style={s.statusItem}>
          <Text style={s.statusLabel}>Auto-backup</Text>
          <Text style={s.statusValue}>{formatDate(lastAutoBackup)}</Text>
        </View>
        <View style={s.statusDivider} />
        <View style={s.statusItem}>
          <Text style={s.statusLabel}>Cloud backup</Text>
          <Text style={s.statusValue}>{formatDate(cloudBackupDate)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["export", "import", "cloud"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); }}
          >
            <Feather
              name={t === "export" ? "upload" : t === "import" ? "download" : "cloud"}
              size={14}
              color={tab === t ? "#D4A843" : colors.mutedForeground}
            />
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "export" ? "Export" : t === "import" ? "Restore" : "Cloud"}
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

            {Platform.OS !== "web" && (
              <View style={s.cloudCard}>
                <Text style={s.cloudTitle}>☁ Cloud Sync</Text>
                <Text style={s.cloudBody}>
                  The backup is saved to your device's Documents folder —
                  automatically included in{" "}
                  <Text style={s.highlight}>iCloud Drive</Text> on iOS and{" "}
                  <Text style={s.highlight}>Google Drive</Text> on Android.
                </Text>
              </View>
            )}
            {Platform.OS === "web" && (
              <View style={s.cloudCard}>
                <Text style={s.cloudTitle}>⬇ Browser Download</Text>
                <Text style={s.cloudBody}>
                  Downloads <Text style={s.highlight}>mystical-runnings-backup.json</Text> directly
                  to your Downloads folder.
                </Text>
              </View>
            )}

            {/* Auto-backup frequency */}
            <View style={s.freqCard}>
              <View style={s.freqTitleRow}>
                <Text style={s.freqTitle}>Auto-Backup Schedule</Text>
                {autoFreq !== "manual" && (
                  <Text style={s.nextRunBadge}>
                    Next: {nextRunLabel(autoFreq, lastAutoBackup)}
                  </Text>
                )}
              </View>
              <View style={s.freqRow}>
                {(["manual", "daily", "weekly"] as AutoBackupFrequency[]).map((f) => (
                  <Pressable
                    key={f}
                    style={[s.freqChip, autoFreq === f && s.freqChipActive]}
                    onPress={() => handleFreqChange(f)}
                  >
                    <Text style={[s.freqChipText, autoFreq === f && s.freqChipTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.freqHint}>
                {autoFreq === "manual"
                  ? "Backups only happen when you tap Export below."
                  : autoFreq === "daily"
                  ? "A silent backup runs once per day when you open the app."
                  : "A silent backup runs once per week when you open the app."}
              </Text>
              {lastAutoBackup && (
                <View style={s.lastAutoRow}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={s.lastAutoText}>
                    Last auto-backup: {formatDate(lastAutoBackup)}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              style={[s.primaryBtn, exporting && s.btnDisabled]}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color="#0D0D1A" />
              ) : (
                <>
                  <Feather name={Platform.OS === "web" ? "download" : "share"} size={18} color="#0D0D1A" />
                  <Text style={s.primaryBtnText}>
                    {Platform.OS === "web" ? "Download Backup" : "Export Backup"}
                  </Text>
                </>
              )}
            </Pressable>
            <Text style={s.hint}>
              {Platform.OS === "web"
                ? "Saves mystical-runnings-backup.json to your Downloads folder."
                : "Opens the share sheet — save to Files, iCloud Drive, Google Drive, email, or AirDrop."}
            </Text>
          </>
        ) : tab === "cloud" ? (
          <>
            <View style={s.infoCard}>
              <Feather name="cloud" size={14} color="#D4A843" />
              <Text style={s.infoText}>
                Cloud backup stores your data on the Mystical Runnings server,
                identified by this device. Use it to move data between devices
                or as an off-device safety net.
              </Text>
            </View>

            {cloudBackupDate != null ? (
              <View style={s.lastRow}>
                <Feather name="check-circle" size={13} color="#4ADE80" />
                <Text style={s.lastText}>
                  Last cloud backup: {formatDate(cloudBackupDate)}
                </Text>
              </View>
            ) : (
              <View style={s.lastRow}>
                <Feather name="alert-circle" size={13} color={colors.mutedForeground} />
                <Text style={[s.lastText, { color: colors.mutedForeground }]}>
                  No cloud backup found for this device yet.
                </Text>
              </View>
            )}

            <Pressable
              style={[s.primaryBtn, cloudUploading && s.btnDisabled]}
              onPress={handleCloudUpload}
              disabled={cloudUploading}
            >
              {cloudUploading ? (
                <ActivityIndicator color="#0D0D1A" />
              ) : (
                <>
                  <Feather name="upload-cloud" size={18} color="#0D0D1A" />
                  <Text style={s.primaryBtnText}>Save to Cloud</Text>
                </>
              )}
            </Pressable>
            <Text style={s.hint}>Uploads a full snapshot of your data to the server.</Text>

            <View style={[s.warningCard, { marginTop: 16 }]}>
              <Feather name="alert-triangle" size={14} color="#F59E0B" />
              <Text style={s.warningText}>
                Restoring from cloud will overwrite all current data. Export a local backup first if needed.
              </Text>
            </View>

            <Pressable
              style={[s.primaryBtn, { backgroundColor: "#7C3AED" }, cloudRestoring && s.btnDisabled]}
              onPress={handleCloudRestore}
              disabled={cloudRestoring}
            >
              {cloudRestoring ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="download-cloud" size={18} color="#fff" />
                  <Text style={[s.primaryBtnText, { color: "#fff" }]}>Restore from Cloud</Text>
                </>
              )}
            </Pressable>
            <Text style={s.hint}>Downloads and restores your most recent cloud backup.</Text>
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
                <Text style={s.stepText}>Tap "Choose Backup File" below.</Text>
              </View>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>2</Text>
                <Text style={s.stepText}>
                  {Platform.OS === "web"
                    ? "Select your backup file from wherever you saved it."
                    : "Navigate to where you saved your backup — iCloud Drive, Google Drive, Files, email attachment, etc."}
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
              {Platform.OS === "web"
                ? "Opens your browser's file picker — select your backup JSON file."
                : "Opens your device file browser — navigate to iCloud Drive, Google Drive, or wherever you stored the backup."}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );

  if (Platform.OS === "web") {
    if (!visible) return null;
    return (
      <View
        style={[s.webOverlay, { position: "fixed" as unknown as "absolute" }]}
        pointerEvents="box-none"
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          {sheetContent}
        </KeyboardAvoidingView>
      </View>
    );
  }

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
        {sheetContent}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styles(colors: any) {
  return StyleSheet.create({
    webOverlay: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.75)",
      zIndex: 9999,
    },
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
    statusStrip: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 12,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 0,
    },
    statusItem: {
      flex: 1,
      alignItems: "center",
      gap: 3,
    },
    statusDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    statusLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontWeight: "500",
      textAlign: "center",
    },
    statusValue: {
      fontSize: 11,
      color: colors.foreground,
      fontWeight: "600",
      textAlign: "center",
    },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 12,
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
    freqCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    freqTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    freqTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    nextRunBadge: {
      fontSize: 11,
      color: "#D4A843",
      fontWeight: "600",
      backgroundColor: "#D4A84322",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    freqRow: {
      flexDirection: "row",
      gap: 8,
    },
    freqChip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    freqChipActive: {
      borderColor: "#D4A843",
      backgroundColor: "#D4A84322",
    },
    freqChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    freqChipTextActive: {
      color: "#D4A843",
    },
    freqHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      lineHeight: 17,
    },
    lastAutoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    lastAutoText: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
  });
}
