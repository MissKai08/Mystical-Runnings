import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
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
} from "@/utils/backup";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = "export" | "restore";
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

export function BackupRestoreModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("export");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [lastAutoBackup, setLastAutoBackup] = useState<Date | null>(null);
  const [autoFreq, setAutoFreq] = useState<AutoBackupFrequency>("manual");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  function showFeedback(type: FeedbackType, message: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, message });
    Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
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
    const [manual, auto, freq] = await Promise.allSettled([
      getLastBackupDate(),
      getLastAutoBackupDate(),
      getAutoBackupFrequency(),
    ]);
    if (manual.status === "fulfilled") setLastBackup(manual.value);
    if (auto.status === "fulfilled") setLastAutoBackup(auto.value);
    if (freq.status === "fulfilled") setAutoFreq(freq.value);
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
      showFeedback(
        "success",
        Platform.OS === "web"
          ? "✦ Backup downloaded — check your Downloads folder."
          : "✦ Backup exported. Use the share sheet to save to iCloud Drive or Google Drive."
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      showFeedback("error", `Export failed: ${msg}`);
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    requireConfirm(
      "This will overwrite all current data with the selected backup file. Make sure you've exported a fresh backup first if needed.",
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
          <Text style={s.statusLabel}>Last export</Text>
          <Text style={s.statusValue}>{formatDate(lastBackup)}</Text>
        </View>
        <View style={s.statusDivider} />
        <View style={s.statusItem}>
          <Text style={s.statusLabel}>Last auto-backup</Text>
          <Text style={s.statusValue}>{formatDate(lastAutoBackup)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["export", "restore"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); setConfirmState(null); }}
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
        {/* Inline confirm */}
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
                Exports all your data — journal entries, sacred intentions,
                altar items, moon water logs, calendar events, streak data,
                and settings — into a single JSON file saved on your device.
                Nothing leaves your device unless you choose to share it.
              </Text>
            </View>

            {/* Where it saves */}
            <View style={s.locationCard}>
              {Platform.OS === "ios" ? (
                <>
                  <Text style={s.locationTitle}>☁ Saves to iCloud Drive automatically</Text>
                  <Text style={s.locationBody}>
                    {"File: " + "mystical-runnings-backup.json\n"}
                    {"Folder: On My iPhone or iCloud Drive\n\n"}
                    The share sheet opens so you can also send it to Files,
                    email, AirDrop, or anywhere else.
                  </Text>
                </>
              ) : Platform.OS === "android" ? (
                <>
                  <Text style={s.locationTitle}>☁ Share to Google Drive or save locally</Text>
                  <Text style={s.locationBody}>
                    {"File: " + "mystical-runnings-backup.json\n"}
                    {"Folder: Internal storage › Documents\n\n"}
                    The share sheet opens so you can send it to Google Drive,
                    Gmail, or any other app.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.locationTitle}>⬇ Downloads to your device</Text>
                  <Text style={s.locationBody}>
                    {"File: " + "mystical-runnings-backup.json\n"}
                    {"Location: Downloads folder\n\n"}
                    Open your Files or Downloads app to find it. From there you
                    can move it to Google Drive, iCloud Drive, or email it.
                  </Text>
                </>
              )}
            </View>

            {/* Auto-backup */}
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
                  <Feather
                    name={Platform.OS === "web" ? "download" : "share"}
                    size={18}
                    color="#0D0D1A"
                  />
                  <Text style={s.primaryBtnText}>
                    {Platform.OS === "web" ? "Download Backup File" : "Export & Share Backup"}
                  </Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            {/* Where to find backup */}
            <View style={s.locationCard}>
              {Platform.OS === "ios" ? (
                <>
                  <Text style={s.locationTitle}>📂 Where to find your backup</Text>
                  <Text style={s.locationBody}>
                    Open the <Text style={s.bold}>Files app</Text> → On My iPhone or iCloud Drive.{"\n"}
                    Look for <Text style={s.mono}>mystical-runnings-backup.json</Text>.
                  </Text>
                </>
              ) : Platform.OS === "android" ? (
                <>
                  <Text style={s.locationTitle}>📂 Where to find your backup</Text>
                  <Text style={s.locationBody}>
                    Open the <Text style={s.bold}>Files app</Text> → Internal storage → Documents.{"\n"}
                    Or check <Text style={s.bold}>Google Drive</Text> if you shared it there.{"\n"}
                    Look for <Text style={s.mono}>mystical-runnings-backup.json</Text>.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.locationTitle}>📂 Where to find your backup</Text>
                  <Text style={s.locationBody}>
                    Open your <Text style={s.bold}>Downloads folder</Text> or Files app.{"\n"}
                    Look for <Text style={s.mono}>mystical-runnings-backup.json</Text>.{"\n"}
                    Or check Google Drive / iCloud Drive if you saved it there.
                  </Text>
                </>
              )}
            </View>

            <View style={s.stepsCard}>
              <Text style={s.stepsTitle}>How to restore</Text>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>1</Text>
                <Text style={s.stepText}>Tap "Choose Backup File" below.</Text>
              </View>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>2</Text>
                <Text style={s.stepText}>
                  Navigate to where you saved your backup and select{" "}
                  <Text style={s.mono}>mystical-runnings-backup.json</Text>.
                </Text>
              </View>
              <View style={s.stepRow}>
                <Text style={s.stepNum}>3</Text>
                <Text style={s.stepText}>
                  Confirm the restore — your data will be replaced with the backup.
                  Restart the app afterwards.
                </Text>
              </View>
            </View>

            <Pressable
              style={[s.primaryBtn, { backgroundColor: "#7C3AED" }, importing && s.btnDisabled]}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="folder" size={18} color="#fff" />
                  <Text style={[s.primaryBtnText, { color: "#fff" }]}>Choose Backup File</Text>
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
    bold: {
      fontWeight: "700",
      color: colors.foreground,
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
