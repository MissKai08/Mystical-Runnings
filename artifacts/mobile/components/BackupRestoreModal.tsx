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
  getAutoBackupDestination,
  setAutoBackupDestination,
  AutoBackupFrequency,
  BackupDestination,
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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextRunLabel(freq: AutoBackupFrequency, lastAuto: Date | null): string {
  if (freq === "off") return "Off";
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

  const [exportDest, setExportDest] = useState<BackupDestination>("local");
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [lastAutoBackup, setLastAutoBackup] = useState<Date | null>(null);
  const [autoFreq, setAutoFreq] = useState<AutoBackupFrequency>("off");
  const [autoDest, setAutoDest] = useState<BackupDestination>("local");

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  function showFeedback(type: FeedbackType, message: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, message });
    Animated.timing(feedbackOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    feedbackTimer.current = setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setFeedback(null));
    }, 4000);
  }

  function requireConfirm(message: string, onConfirm: () => void) {
    setConfirmState({ message, onConfirm });
  }

  const refreshAll = useCallback(async () => {
    const [manual, auto, freq, dest] = await Promise.allSettled([
      getLastBackupDate(),
      getLastAutoBackupDate(),
      getAutoBackupFrequency(),
      getAutoBackupDestination(),
    ]);
    if (manual.status === "fulfilled") setLastBackup(manual.value);
    if (auto.status === "fulfilled") setLastAutoBackup(auto.value);
    if (freq.status === "fulfilled") setAutoFreq(freq.value);
    if (dest.status === "fulfilled") setAutoDest(dest.value);
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

  async function handleAutoDestChange(dest: BackupDestination) {
    Haptics.selectionAsync();
    setAutoDest(dest);
    await setAutoBackupDestination(dest);
  }

  function handleExportDestChange(dest: BackupDestination) {
    Haptics.selectionAsync();
    setExportDest(dest);
  }

  async function handleExport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      await exportBackup(exportDest);
      await refreshAll();
      if (Platform.OS === "web") {
        showFeedback("success", "✦ Backup downloaded — check your Downloads folder.");
      } else if (exportDest === "cloud") {
        showFeedback("success", "✦ Share sheet opened — save to iCloud Drive, Google Drive, or anywhere you like.");
      } else {
        showFeedback(
          "success",
          Platform.OS === "ios"
            ? "✦ Saved to Documents — find it in the Files app or enable iCloud Drive to sync automatically."
            : "✦ Saved to Documents — find it in your Files app."
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      showFeedback("error", `Export failed: ${msg}`);
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    requireConfirm(
      "This will overwrite all current data with the selected backup file. Export a fresh backup first if you want to keep your current data.",
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

  function DestinationToggle({
    value,
    onChange,
    localLabel,
    cloudLabel,
  }: {
    value: BackupDestination;
    onChange: (d: BackupDestination) => void;
    localLabel: string;
    cloudLabel: string;
  }) {
    return (
      <View style={s.destRow}>
        <Pressable
          style={[s.destChip, value === "local" && s.destChipActive]}
          onPress={() => onChange("local")}
        >
          <Feather
            name="hard-drive"
            size={13}
            color={value === "local" ? "#D4A843" : colors.mutedForeground}
          />
          <Text style={[s.destChipText, value === "local" && s.destChipTextActive]}>
            {localLabel}
          </Text>
        </Pressable>
        <Pressable
          style={[s.destChip, value === "cloud" && s.destChipActive]}
          onPress={() => onChange("cloud")}
        >
          <Feather
            name="cloud"
            size={13}
            color={value === "cloud" ? "#D4A843" : colors.mutedForeground}
          />
          <Text style={[s.destChipText, value === "cloud" && s.destChipTextActive]}>
            {cloudLabel}
          </Text>
        </Pressable>
      </View>
    );
  }

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
            onPress={() => {
              Haptics.selectionAsync();
              setTab(t);
              setConfirmState(null);
            }}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
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
            {/* Manual export destination */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Save to</Text>
              <DestinationToggle
                value={exportDest}
                onChange={handleExportDestChange}
                localLabel="Local (Device)"
                cloudLabel="Cloud (Share)"
              />
              <Text style={s.sectionHint}>
                {Platform.OS === "web"
                  ? "Downloads the backup file to your device."
                  : exportDest === "local"
                  ? Platform.OS === "ios"
                    ? "Saves to your Documents folder. Open the Files app to find it. Enable iCloud Drive to sync it automatically."
                    : "Saves to your Documents folder. Open your Files app to find it."
                  : Platform.OS === "ios"
                  ? "Saves the file and opens the share sheet — choose iCloud Drive, AirDrop, email, or any app."
                  : "Saves the file and opens the share sheet — choose Google Drive, Gmail, or any app."}
              </Text>
            </View>

            {/* Auto-backup */}
            <View style={s.sectionCard}>
              <View style={s.sectionTitleRow}>
                <Text style={s.sectionTitle}>Auto-Backup</Text>
                {autoFreq !== "off" && (
                  <Text style={s.nextRunBadge}>
                    Next: {nextRunLabel(autoFreq, lastAutoBackup)}
                  </Text>
                )}
              </View>

              {/* Frequency */}
              <Text style={s.subLabel}>Frequency</Text>
              <View style={s.chipRow}>
                {(["off", "daily", "weekly"] as AutoBackupFrequency[]).map((f) => (
                  <Pressable
                    key={f}
                    style={[s.chip, autoFreq === f && s.chipActive]}
                    onPress={() => handleFreqChange(f)}
                  >
                    <Text style={[s.chipText, autoFreq === f && s.chipTextActive]}>
                      {f === "off" ? "Off" : f === "daily" ? "Daily" : "Weekly"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Destination — only shown when auto-backup is on */}
              {autoFreq !== "off" && (
                <>
                  <Text style={[s.subLabel, { marginTop: 10 }]}>Destination</Text>
                  <DestinationToggle
                    value={autoDest}
                    onChange={handleAutoDestChange}
                    localLabel="Local"
                    cloudLabel="Cloud"
                  />
                  <Text style={s.sectionHint}>
                    {Platform.OS === "ios"
                      ? autoDest === "cloud"
                        ? "Saves silently to your Documents folder, which iCloud Drive syncs automatically if enabled in Settings."
                        : "Saves silently to your Documents folder on this device."
                      : Platform.OS === "android"
                      ? autoDest === "cloud"
                        ? "Saves silently to your Documents folder. For Google Drive, use Export → Cloud to send it manually — silent uploads require Google Drive integration."
                        : "Saves silently to your Documents folder on this device."
                      : "Saves a backup file each time the schedule is due."}
                  </Text>
                </>
              )}

              {autoFreq === "off" && (
                <Text style={s.sectionHint}>
                  Auto-backup is off. Use the Export button below to save manually whenever you like.
                </Text>
              )}

              {lastAutoBackup && autoFreq !== "off" && (
                <View style={s.lastRow}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={s.lastText}>Last auto-backup: {formatDate(lastAutoBackup)}</Text>
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
                    name={
                      Platform.OS === "web"
                        ? "download"
                        : exportDest === "cloud"
                        ? "share"
                        : "save"
                    }
                    size={18}
                    color="#0D0D1A"
                  />
                  <Text style={s.primaryBtnText}>
                    {Platform.OS === "web"
                      ? "Download Backup"
                      : exportDest === "cloud"
                      ? "Export & Share to Cloud"
                      : "Export to Device"}
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
                    Open the <Text style={s.bold}>Files app</Text> → On My iPhone (or iCloud Drive
                    if you exported to Cloud).{"\n"}
                    Look for <Text style={s.mono}>mystical-runnings-backup.json</Text>.
                  </Text>
                </>
              ) : Platform.OS === "android" ? (
                <>
                  <Text style={s.locationTitle}>📂 Where to find your backup</Text>
                  <Text style={s.locationBody}>
                    Open the <Text style={s.bold}>Files app</Text> → Internal storage → Documents.
                    {"\n"}
                    Or check <Text style={s.bold}>Google Drive</Text> if you shared it there.{"\n"}
                    Look for <Text style={s.mono}>mystical-runnings-backup.json</Text>.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.locationTitle}>📂 Where to find your backup</Text>
                  <Text style={s.locationBody}>
                    Open your <Text style={s.bold}>Downloads folder</Text>.{"\n"}
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
                  Confirm — your data will be replaced. Restart the app afterwards.
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
            { opacity: feedbackOpacity, bottom: insets.bottom + 16 },
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
      paddingBottom: 80,
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
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    subLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionHint: {
      fontSize: 12,
      color: colors.mutedForeground,
      lineHeight: 18,
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
    chipRow: {
      flexDirection: "row",
      gap: 8,
    },
    chip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      borderColor: "#D4A843",
      backgroundColor: "#D4A84322",
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    chipTextActive: {
      color: "#D4A843",
    },
    destRow: {
      flexDirection: "row",
      gap: 8,
    },
    destChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    destChipActive: {
      borderColor: "#D4A843",
      backgroundColor: "#D4A84322",
    },
    destChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    destChipTextActive: {
      color: "#D4A843",
    },
    lastRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    lastText: {
      fontSize: 11,
      color: colors.mutedForeground,
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
    bold: {
      fontWeight: "700",
      color: colors.foreground,
    },
    mono: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 12,
      color: "#A78BFA",
    },
    feedbackBanner: {
      position: "absolute",
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
