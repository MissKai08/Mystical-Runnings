import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  type RitualStep,
  type RitualLog,
  getStepsForPhase,
  makeCycleKey,
  getLogForCycle,
  upsertLog,
  getAllLogs,
  newLog,
} from "@/utils/moonWaterStorage";

// ─── Category colors ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Prepare:   "#7C3AED",
  Intend:    "#D4A843",
  Fill:      "#22D3EE",
  Charge:    "#A78BFA",
  Amplify:   "#8B5CF6",
  Bless:     "#D4A843",
  Harvest:   "#22C55E",
  Use:       "#34D399",
  Release:   "#F97316",
  Offer:     "#EC4899",
  Gratitude: "#D4A843",
  Honor:     "#C4B5FD",
  Reflect:   "#94A3B8",
  Tend:      "#60A5FA",
};

function catColor(cat: string): string {
  return CAT_COLORS[cat] ?? "#A78BFA";
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  checked,
  onToggle,
  accent,
}: {
  step: RitualStep;
  checked: boolean;
  onToggle: () => void;
  accent: string;
}) {
  const colors = useColors();
  const [tipOpen, setTipOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const cc = catColor(step.category);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          sc.card,
          {
            backgroundColor: checked ? accent + "15" : colors.card,
            borderColor: checked ? accent + "60" : colors.border,
          },
        ]}
      >
        <View style={[sc.check, { borderColor: checked ? accent : colors.border, backgroundColor: checked ? accent : "transparent" }]}>
          {checked && <Feather name="check" size={11} color="#080714" />}
        </View>
        <View style={sc.body}>
          <View style={sc.topRow}>
            <View style={[sc.catBadge, { backgroundColor: cc + "22", borderColor: cc + "55" }]}>
              <Text style={[sc.catText, { color: cc }]}>{step.category}</Text>
            </View>
            {step.tip && (
              <Pressable onPress={() => setTipOpen((v) => !v)} hitSlop={8}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Text style={[sc.label, { color: checked ? colors.mutedForeground : colors.foreground }, checked && sc.labelDone]}>
            {step.label}
          </Text>
          {tipOpen && step.tip && (
            <Text style={[sc.tip, { color: colors.mutedForeground, borderLeftColor: accent + "66" }]}>
              {step.tip}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  body: { flex: 1, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  catText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  label: { fontSize: 14, lineHeight: 20 },
  labelDone: { textDecorationLine: "line-through", opacity: 0.6 },
  tip: {
    fontSize: 12,
    lineHeight: 18,
    borderLeftWidth: 2,
    paddingLeft: 10,
    marginTop: 2,
    fontStyle: "italic",
  },
});

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({ log, accent }: { log: RitualLog; accent: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const steps = getStepsForPhase(log.phase);
  const pct = steps.length > 0 ? Math.round((log.completedSteps.length / steps.length) * 100) : 0;

  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); setOpen((v) => !v); }}
      style={[hc.card, { backgroundColor: colors.card, borderColor: log.isComplete ? accent + "55" : colors.border }]}
    >
      <View style={hc.row}>
        <View style={hc.left}>
          <Text style={[hc.name, { color: log.isComplete ? accent : colors.foreground }]}>{log.phaseName}</Text>
          <Text style={[hc.date, { color: colors.mutedForeground }]}>
            {new Date(log.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        <View style={hc.right}>
          {log.isComplete ? (
            <View style={[hc.badge, { backgroundColor: accent + "22", borderColor: accent + "55" }]}>
              <Text style={[hc.badgeText, { color: accent }]}>Complete</Text>
            </View>
          ) : (
            <Text style={[hc.pct, { color: colors.mutedForeground }]}>{pct}%</Text>
          )}
          <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
        </View>
      </View>
      {open && (
        <View style={[hc.detail, { borderTopColor: colors.border }]}>
          <View style={hc.barRow}>
            <View style={[hc.barBg, { backgroundColor: colors.border }]}>
              <View style={[hc.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
            </View>
            <Text style={[hc.barLabel, { color: colors.mutedForeground }]}>
              {log.completedSteps.length}/{steps.length} steps
            </Text>
          </View>
          {log.notes.trim() !== "" && (
            <Text style={[hc.notes, { color: colors.mutedForeground, borderLeftColor: accent + "66" }]}>
              {log.notes}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const hc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  left: { gap: 2 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 14, fontWeight: "700" },
  date: { fontSize: 12 },
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  pct: { fontSize: 13, fontWeight: "600" },
  detail: { borderTopWidth: 1, padding: 14, gap: 10 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barBg: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  barLabel: { fontSize: 11, fontWeight: "600", minWidth: 52 },
  notes: {
    fontSize: 13,
    lineHeight: 19,
    borderLeftWidth: 2,
    paddingLeft: 10,
    fontStyle: "italic",
  },
});

// ─── Phase accent colors ──────────────────────────────────────────────────────

const PHASE_ACCENT: Record<string, string> = {
  "dark-moon": "#4C1D95",
  "new-moon": "#6D28D9",
  "waxing-crescent": "#7C3AED",
  "first-quarter": "#8B5CF6",
  "waxing-gibbous": "#A78BFA",
  "full-moon": "#D4A843",
  "named-moon": "#D4A843",
  "waning-gibbous": "#A78BFA",
  "last-quarter": "#8B5CF6",
  "waning-crescent": "#6D28D9",
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  phase: string;
  phaseName: string;
  phaseEmoji: string;
}

type Tab = "ritual" | "history";

export default function MoonWaterModal({ visible, onClose, phase, phaseName, phaseEmoji }: Props) {
  const colors = useColors();
  const accent = PHASE_ACCENT[phase] ?? "#A78BFA";
  const steps = getStepsForPhase(phase);
  const cycleKey = makeCycleKey(phase);

  const [tab, setTab] = useState<Tab>("ritual");
  const [log, setLog] = useState<RitualLog | null>(null);
  const [history, setHistory] = useState<RitualLog[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load current cycle log + history when modal opens
  useEffect(() => {
    if (!visible) return;
    getLogForCycle(cycleKey).then((existing) => {
      if (existing) {
        setLog(existing);
        setNotes(existing.notes);
      } else {
        const fresh = newLog(phase, phaseName, cycleKey);
        setLog(fresh);
        setNotes("");
      }
    });
    getAllLogs().then(setHistory);
  }, [visible, cycleKey]);

  const toggleStep = useCallback((stepId: string) => {
    if (!log) return;
    const already = log.completedSteps.includes(stepId);
    const updated: RitualLog = {
      ...log,
      completedSteps: already
        ? log.completedSteps.filter((id) => id !== stepId)
        : [...log.completedSteps, stepId],
      updatedAt: new Date().toISOString(),
    };
    setLog(updated);
    upsertLog(updated);
  }, [log]);

  const handleSave = useCallback(async () => {
    if (!log) return;
    setSaving(true);
    const updated: RitualLog = { ...log, notes, updatedAt: new Date().toISOString() };
    setLog(updated);
    await upsertLog(updated);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [log, notes]);

  const handleComplete = useCallback(async () => {
    if (!log) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated: RitualLog = {
      ...log,
      notes,
      isComplete: true,
      completedSteps: steps.map((s) => s.id),
      updatedAt: new Date().toISOString(),
    };
    setLog(updated);
    await upsertLog(updated);
    getAllLogs().then(setHistory);
  }, [log, notes, steps]);

  const handleClose = () => {
    // Auto-save notes on close
    if (log && notes !== log.notes) {
      upsertLog({ ...log, notes, updatedAt: new Date().toISOString() });
    }
    onClose();
  };

  const completedCount = log?.completedSteps.length ?? 0;
  const pct = steps.length > 0 ? completedCount / steps.length : 0;
  const allDone = completedCount === steps.length && steps.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[s.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Moon Water Ritual</Text>
            <Text style={[s.headerSub, { color: accent }]}>{phaseEmoji}  {phaseName}</Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* Tab bar */}
        <View style={[s.tabBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {(["ritual", "history"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              style={[s.tabBtn, tab === t && { backgroundColor: accent }]}
            >
              <Text style={[s.tabLabel, { color: tab === t ? "#fff" : colors.mutedForeground }]}>
                {t === "ritual" ? "Today's Ritual" : "History"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "ritual" ? (
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress bar */}
            <View style={s.progressWrap}>
              <View style={[s.progressBg, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    s.progressFill,
                    { width: `${Math.round(pct * 100)}%` as any, backgroundColor: accent },
                  ]}
                />
              </View>
              <Text style={[s.progressLabel, { color: allDone ? accent : colors.mutedForeground }]}>
                {allDone ? "✦ Ritual Complete" : `${completedCount} of ${steps.length} steps`}
              </Text>
            </View>

            {/* Completion banner */}
            {log?.isComplete && (
              <View style={[s.completeBanner, { backgroundColor: accent + "18", borderColor: accent + "55" }]}>
                <Text style={[s.completeBannerText, { color: accent }]}>
                  ✦ This cycle's ritual is marked complete
                </Text>
              </View>
            )}

            {/* Step list */}
            <View style={s.stepList}>
              {steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  checked={log?.completedSteps.includes(step.id) ?? false}
                  onToggle={() => toggleStep(step.id)}
                  accent={accent}
                />
              ))}
            </View>

            {/* Notes */}
            <View style={[s.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.notesLabel, { color: accent }]}>RITUAL NOTES</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Record what you prepared, felt, or noticed…"
                placeholderTextColor={colors.mutedForeground}
                style={[s.notesInput, { color: colors.foreground }]}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </View>

            {/* Action buttons */}
            <View style={s.actions}>
              <Pressable
                onPress={handleSave}
                style={[s.saveBtn, { backgroundColor: accent + "20", borderColor: accent + "55" }]}
              >
                <Text style={[s.saveBtnText, { color: accent }]}>
                  {saving ? "Saving…" : "Save Notes"}
                </Text>
              </Pressable>
              {!log?.isComplete && (
                <Pressable
                  onPress={handleComplete}
                  style={[s.completeBtn, { backgroundColor: accent }]}
                >
                  <Text style={s.completeBtnText}>Mark Ritual Complete</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {history.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={[s.emptyEmoji]}>🌊</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No ritual logs yet</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                  Complete your first moon water ritual to see it here.
                </Text>
              </View>
            ) : (
              <View style={s.historyList}>
                {history.map((item) => (
                  <HistoryCard
                    key={item.id}
                    log={item}
                    accent={PHASE_ACCENT[item.phase] ?? "#A78BFA"}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 36 },
  closeTxt: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  headerRight: { width: 36 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 48, gap: 12 },
  progressWrap: { gap: 6 },
  progressBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
  completeBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  completeBannerText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  stepList: { gap: 8 },
  notesCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  notesLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  notesInput: { fontSize: 14, lineHeight: 22, minHeight: 80 },
  actions: { gap: 10, marginTop: 4 },
  saveBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "700" },
  completeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  completeBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  historyList: { gap: 8 },
});
