import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  exportBackup,
  importBackupFromFile,
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
type FeedbackType = "success" | "error";

interface Feedback {
  type: FeedbackType;
  message: string;
}

interface ConfirmState {
  message: string;
  onConfirm: () => void;
}

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

function shortDeviceId(id: string): string {
  return id.split("-").pop() ?? id.slice(-8);
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
  const [deviceId, setDeviceId] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  function showFeedback(type: FeedbackType, message: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, message });
    Animated.sequence([
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    feedbackTimer.current = setTimeout(() => {
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
        () => setFeedback(null)
      );
    }, 4000);
  }

  function requireConfirm(message: string, onConfirm: () => void) {
    setConfirmState({ message, onConfirm });
  }

  const refreshAll = useCallback(async () => {
    const { getDeviceId } = await import("@/utils/backup");
    const [manual, auto, cloud, freq, devId] = await Promise.allSettled([
      getLastBackupDate(),
      getLastAutoBackupDate(),
      getCloudBackupDate(),
      getAutoBackupFrequency(),
      getDeviceId(),
    ]);
    if (manual.status === "fulfilled") setLastBackup(manual.value);
    if (auto.status === "fulfilled") setLastAutoBackup(auto.value);
    if (cloud.status === "fulfilled") setCloudBackupDate(cloud.value);
    if (freq.status === "fulfilled") setAutoFreq(freq.value);
    if (devId.status === "fulfilled") setDeviceId(devId.value);
  }, []);

  useEffect(() => {
    if (visible) {
      refreshAll();
      setFeedback(null);
      setConfirmState(null);
    }
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
      if (Platform.OS === "web") {
        showFeedback("success", "✦ Backup downloaded to your Downloads folder.");
      } else {
        showFeedback("success", "✦ Backup exported successfully.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      if (Platform.OS !== "web") Alert.alert("Export Failed", msg);
      else showFeedback("error", `Export failed: ${msg}`);
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
      showFeedback("success", "✦ Backup saved to cloud. Timestamp updated above.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      showFeedback("error", `Cloud upload failed: ${msg}`);
    } finally {
      setCloudUploading(false);
    }
  }

  function handleCloudRestore() {
    requireConfirm(
      "This will overwrite all current data with your cloud backup. Export a local copy first if needed.",
      async () => {
        setConfirmState(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setCloudRestoring(true);
        try {
          await downloadBackupFromCloud();
          await refreshAll();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showFeedback("success", "✦ Cloud backup restored. Restart the app to see all changes.");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Restore failed.";
          showFeedback("error", `Restore failed: ${msg}`);
        } finally {
          setCloudRestoring(false);
        }
      }
    );
  }

  function handleImport() {
    requireConfirm(
      "This will overwrite all current data with the selected backup file. Export a local copy first if needed.",
      async () => {
        setConfirmState(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setImporting(true);
        try {
          await importBackupFromFile();
          await refreshAll();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showFeedback("success", "✦ Backup restored. Restart the app to see all changes.");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Restore failed.";
          if (msg !== "canceled") showFeedback("error", `Restore failed: ${msg}`);
          else setConfirmState(null);
        } finally {
          setImporting(false);
        }
      }
    );
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
            onPress={() => { Haptics.selectionAsync(); setTab(t); setConfirmState(null); }}
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
        {/* In-modal confirm banner */}
        {confirmState && (
          <View style={s.confirmCard}>
            <Feather name="alert-triangle" size={16} color="#F59E0B" />
            <Text style={s.confirmText}>{confirmState.message}</Text>
            <View style={s.confirmBtns}>
              <Pressable style={s.confirmCancel} onPress={() => setConfirmState(null)}>
                <Text style={s.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={s.confirmOk} onPress={confirmState.onConfirm}>
                <Text style={s.confirmOkText}>Yes, overwrite</Text>
              </Pressable>
            </View>
          </View>
        )}

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

            <View style={s.locationCard}>
              <Text style={s.locationTitle}>
                {Platform.OS === "web" ? "⬇ Where it saves" : "📁 Where it saves"}
              </Text>
              <Text style={s.locationBody}>
                {Platform.OS === "web"
                  ? "File: mystical-runnings-backup.json\nLocation: Your device's Downloads folder\nOpen your Files or Downloads app to find it."
                  : Platform.OS === "ios"
                  ? "File: mystical-runnings-backup.json\nLocation: On My iPhone › iCloud Drive (auto-syncs)\nShare sheet opens to send it anywhere."
                  : "File: mystical-runnings-backup.json\nLocation: Internal storage › Documents\nShare sheet opens to send it anywhere."}
              </Text>
            </View>

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
                  ? "Backups only happen when you tap the button below."
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

            <View style={s.locationCard}>
              <Text style={s.locationTitle}>☁ Backup location</Text>
              <Text style={s.locationBody}>
                {"Stored on: Mystical Runnings server\nDevice ID: …" +
                  shortDeviceId(deviceId) +
                  "\nLast saved: " +
                  formatDate(cloudBackupDate)}
              </Text>
            </View>

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
            <Text style={s.hint}>Uploads a full snapshot — timestamp above will update.</Text>

            <View style={s.divider} />

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
            <Text style={s.hint}>
              {cloudBackupDate
                ? `Restores your backup from ${formatDate(cloudBackupDate)}.`
                : "No cloud backup found for this device yet."}
            </Text>
          </>
        ) : (
          <>
            <View style={s.locationCard}>
              <Text style={s.locationTitle}>📂 How to find your backup file</Text>
              <Text style={s.locationBody}>
                {Platform.OS === "web"
                  ? "After exporting, open your Downloads folder or the Files app on your device. Look for mystical-runnings-backup.json."
                  : Platform.OS === "ios"
                  ? "Open the Files app › On My iPhone or iCloud Drive. Look for mystical-runnings-backup.json."
                  : "Open the Files app › Internal storage › Downloads. Look for mystical-runnings-backup.json."}
              </Text>
            </View>

            <View style={s.stepsCard}>
              <Text style={s.stepsTitle}>Steps</Text>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>1</Text>
                <Text style={s.stepText}>Tap "Choose Backup File" below.</Text>
              </View>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>2</Text>
                <Text style={s.stepText}>
                  {Platform.OS === "web"
                    ? "Navigate to Downloads and select your backup file."
                    : "Navigate to where you saved your backup — Downloads, iCloud Drive, Google Drive, etc."}
                </Text>
              </View>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>3</Text>
                <Text style={s.stepText}>
                  Select <Text style={s.mono}>mystical-runnings-backup.json</Text> — your data will be restored.
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
          </>
        )}
      </ScrollView>

      {/* In-modal feedback toast */}
      {feedback && (
        <Animated.View
          style={[
            s.feedbackBanner,
            feedback.type === "success" ? s.feedbackSuccess : s.feedbackError,
            { opacity: feedbackOpacity },
          ]}
        >
          <Feather
            name={feedback.type === "success" ? "check-circle" : "alert-circle"}
            size={16}
            color={feedback.type === "success" ? "#4ADE80" : "#F87171"}
          />
          <Text style={s.feedbackText}>{feedback.message}</Text>
        </Animated.View>
      )}
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
    confirmCard: {
      backgroundColor: "#1C1300",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#F59E0B66",
      padding: 16,
      gap: 12,
    },
    confirmText: {
      fontSize: 13,
      color: "#F59E0B",
      lineHeight: 19,
    },
    confirmBtns: {
      flexDirection: "row",
      gap: 10,
    },
    confirmCancel: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmCancelText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    confirmOk: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: "#7C3AED",
    },
    confirmOkText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
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
    locationCard: {
      backgroundColor: "#1A1A2E",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#D4A84344",
      padding: 14,
      gap: 8,
    },
    locationTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#D4A843",
    },
    locationBody: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 20,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#D4A843",
      borderRadius: 12,
      paddingVertical: 14,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
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
    feedbackBanner: {
      position: "absolute",
      bottom: 24,
      left: 20,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    feedbackSuccess: {
      backgroundColor: "#052E16",
      borderWidth: 1,
      borderColor: "#4ADE8044",
    },
    feedbackError: {
      backgroundColor: "#2D0A0A",
      borderWidth: 1,
      borderColor: "#F8717144",
    },
    feedbackText: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 18,
    },
  });
}
