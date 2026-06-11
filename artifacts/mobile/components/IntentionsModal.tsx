import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  loadIntentions,
  addIntention,
  addCheckIn,
  updateStatus,
  updateIntentionText,
  deleteIntentionById,
  SacredIntention,
  IntentionStatus,
} from "@/utils/sacredIntentionsStorage";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function cycleKeyForDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function cycleNameForDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<IntentionStatus, { label: string; color: string; emoji: string }> = {
  active:   { label: "Active",    color: "#A78BFA", emoji: "✦" },
  complete: { label: "Fulfilled", color: "#D4A843", emoji: "✦" },
  released: { label: "Released",  color: "#94A3B8", emoji: "✦" },
};

// ─── Check-In Mini Modal ─────────────────────────────────────────────────────

function CheckInModal({
  visible,
  intentionText,
  onSave,
  onClose,
}: {
  visible: boolean;
  intentionText: string;
  onSave: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setText(""); }, [visible]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await onSave(text.trim());
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ci.overlay} onPress={onClose}>
        <Pressable style={[ci.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ci.title, { color: colors.foreground }]}>Check In</Text>
          <Text style={[ci.intentionPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
            "{intentionText}"
          </Text>
          <TextInput
            style={[ci.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="How is this intention unfolding…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ci.btnRow}>
            <Pressable onPress={onClose} style={[ci.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ci.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ci.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ci.saveTxt}>Save</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ci = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 17, fontWeight: "700" },
  intentionPreview: { fontSize: 13, fontStyle: "italic", lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 100,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveTxt: { fontSize: 14, fontWeight: "800", color: "#080714" },
});

// ─── Add Intention Mini Modal ─────────────────────────────────────────────────

function AddIntentionModal({
  visible,
  onSave,
  onClose,
}: {
  visible: boolean;
  onSave: (text: string, cycleKey: string, cycleName: string) => Promise<void>;
  onClose: () => void;
}) {
  const colors = useColors();
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const cycles = [
    { key: cycleKeyForDate(now), name: cycleNameForDate(now), label: "This month" },
    { key: cycleKeyForDate(nextMonth), name: cycleNameForDate(nextMonth), label: "Next month" },
  ];

  const [text, setText] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setText(""); setSelectedCycle(0); } }, [visible]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const cycle = cycles[selectedCycle];
    await onSave(text.trim(), cycle.key, cycle.name);
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ai.overlay} onPress={onClose}>
        <Pressable style={[ai.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ai.title, { color: colors.foreground }]}>Set an Intention</Text>
          <Text style={[ai.subtitle, { color: colors.mutedForeground }]}>
            What do you wish to call into being?
          </Text>

          <TextInput
            style={[ai.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />

          <Text style={[ai.cycleLabel, { color: colors.mutedForeground }]}>Cycle</Text>
          <View style={ai.cycleRow}>
            {cycles.map((c, i) => (
              <Pressable
                key={c.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedCycle(i); }}
                style={[
                  ai.cyclePill,
                  { borderColor: selectedCycle === i ? "#D4A843" : colors.border },
                  selectedCycle === i && { backgroundColor: "#D4A84322" },
                ]}
              >
                <Text style={[ai.cyclePillMain, { color: selectedCycle === i ? "#D4A843" : colors.foreground }]}>
                  {c.name}
                </Text>
                <Text style={[ai.cyclePillSub, { color: colors.mutedForeground }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={ai.btnRow}>
            <Pressable onPress={onClose} style={[ai.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ai.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ai.saveBtn, { backgroundColor: "#7C3AED", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={ai.saveTxt}>Set Intention</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ai = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: -6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 80,
  },
  cycleLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  cycleRow: { flexDirection: "row", gap: 10 },
  cyclePill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 3,
  },
  cyclePillMain: { fontSize: 13, fontWeight: "700" },
  cyclePillSub: { fontSize: 11 },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});

// ─── Edit Intention Modal ─────────────────────────────────────────────────────

function EditIntentionModal({
  visible,
  intention,
  onSave,
  onClose,
}: {
  visible: boolean;
  intention: SacredIntention | null;
  onSave: (id: string, text: string) => Promise<void>;
  onClose: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible && intention) setText(intention.text); }, [visible, intention]);

  const handleSave = async () => {
    if (!text.trim() || !intention) return;
    setSaving(true);
    await onSave(intention.id, text.trim());
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={ei.overlay} onPress={onClose}>
        <Pressable style={[ei.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[ei.title, { color: colors.foreground }]}>Edit Intention</Text>
          <TextInput
            style={[ei.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="I intend to…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            autoFocus
          />
          <View style={ei.btnRow}>
            <Pressable onPress={onClose} style={[ei.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[ei.cancelTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!text.trim() || saving}
              style={[ei.saveBtn, { backgroundColor: "#D4A843", opacity: !text.trim() || saving ? 0.5 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#080714" size="small" />
                : <Text style={ei.saveTxt}>Save Changes</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ei = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 17, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 100,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveTxt: { fontSize: 14, fontWeight: "800", color: "#080714" },
});

// ─── Intention Card ───────────────────────────────────────────────────────────

function IntentionCard({
  intention,
  colors,
  onCheckIn,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  intention: SacredIntention;
  colors: ReturnType<typeof useColors>;
  onCheckIn: () => void;
  onStatusChange: (status: IntentionStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[intention.status];
  const isActive = intention.status === "active";

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[] = [];
    if (intention.status !== "complete") {
      options.push({ text: "✦ Mark as Fulfilled", onPress: () => onStatusChange("complete") });
    }
    if (intention.status !== "released") {
      options.push({ text: "○ Release This Intention", onPress: () => onStatusChange("released") });
    }
    if (intention.status !== "active") {
      options.push({ text: "↺ Reactivate", onPress: () => onStatusChange("active") });
    }
    options.push({ text: "Delete", style: "destructive", onPress: onDelete });
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Sacred Intention", intention.text.slice(0, 60) + (intention.text.length > 60 ? "…" : ""), options);
  };

  const cardBorder =
    intention.status === "complete"
      ? "#D4A84366"
      : intention.status === "released"
      ? "#94A3B833"
      : "#7C3AED44";

  const cardBg =
    intention.status === "complete"
      ? "#D4A84309"
      : intention.status === "released"
      ? "#94A3B809"
      : "#7C3AED09";

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[s.intentionCard, { backgroundColor: colors.card, borderColor: cardBorder }]}
    >
      {/* Status stripe */}
      <View style={[s.statusStripe, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <Text style={[s.statusDot, { color: cfg.color }]}>{cfg.emoji}</Text>
        <Text style={[s.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        <View style={[s.cycleBadge, { borderColor: cardBorder }]}>
          <Text style={[s.cycleBadgeTxt, { color: colors.mutedForeground }]}>{intention.cycleName}</Text>
        </View>
        {intention.checkIns.length > 0 && (
          <View style={s.checkInCount}>
            <Feather name="check-circle" size={10} color={colors.mutedForeground} />
            <Text style={[s.checkInCountTxt, { color: colors.mutedForeground }]}>
              {intention.checkIns.length}
            </Text>
          </View>
        )}
      </View>

      {/* Intention text */}
      <Text style={[s.intentionText, { color: colors.foreground }]}>
        {intention.text}
      </Text>

      {/* Check-ins (expandable) */}
      {intention.checkIns.length > 0 && (
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setExpanded((v) => !v); }}
          style={[s.checkInsToggle, { borderTopColor: colors.border }]}
        >
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={colors.mutedForeground}
          />
          <Text style={[s.checkInsToggleTxt, { color: colors.mutedForeground }]}>
            {expanded ? "Hide" : "Show"} {intention.checkIns.length} check-in{intention.checkIns.length !== 1 ? "s" : ""}
          </Text>
        </Pressable>
      )}

      {expanded && (
        <View style={[s.checkInsList, { borderTopColor: colors.border }]}>
          {[...intention.checkIns].reverse().map((ci) => (
            <View key={ci.id} style={[s.checkInItem, { borderLeftColor: cardBorder }]}>
              <Text style={[s.checkInText, { color: colors.foreground }]}>{ci.text}</Text>
              <Text style={[s.checkInDate, { color: colors.mutedForeground }]}>
                {new Date(ci.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions row */}
      <View style={[s.actionsRow, { borderTopColor: colors.border }]}>
        {isActive && (
          <Pressable
            onPress={() => { Haptics.selectionAsync(); onCheckIn(); }}
            style={s.actionBtn}
          >
            <Feather name="plus-circle" size={13} color="#A78BFA" />
            <Text style={[s.actionBtnTxt, { color: "#A78BFA" }]}>Check In</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onEdit(); }}
          style={s.actionBtn}
        >
          <Feather name="edit-2" size={13} color={colors.mutedForeground} />
          <Text style={[s.actionBtnTxt, { color: colors.mutedForeground }]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
          style={s.actionBtn}
        >
          <Feather name="trash-2" size={13} color="#EF4444" />
          <Text style={[s.actionBtnTxt, { color: "#EF4444" }]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function IntentionsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [intentions, setIntentions] = useState<SacredIntention[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SacredIntention | null>(null);
  const [checkInTarget, setCheckInTarget] = useState<SacredIntention | null>(null);
  const [showPast, setShowPast] = useState(false);

  const reload = useCallback(async () => {
    setIntentions(await loadIntentions());
  }, []);

  useEffect(() => {
    if (visible) reload();
  }, [visible, reload]);

  const now = new Date();
  const currentKey = cycleKeyForDate(now);

  const currentIntentions = intentions.filter(
    (i) => i.cycleKey === currentKey || (i.status === "active" && i.cycleKey < currentKey)
  );
  const pastIntentions = intentions.filter(
    (i) => i.cycleKey < currentKey && i.status !== "active"
  );

  const handleAdd = async (text: string, cycleKey: string, cycleName: string) => {
    await addIntention(text, cycleKey, cycleName);
    await reload();
  };

  const handleCheckIn = async (text: string) => {
    if (!checkInTarget) return;
    await addCheckIn(checkInTarget.id, text);
    await reload();
  };

  const handleStatus = async (id: string, status: IntentionStatus) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateStatus(id, status);
    await reload();
  };

  const handleEdit = async (id: string, text: string) => {
    await updateIntentionText(id, text);
    await reload();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Intention", "Remove this intention permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteIntentionById(id);
          await reload();
        },
      },
    ]);
  };

  const activeCount = currentIntentions.filter((i) => i.status === "active").length;

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
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Sacred Intentions</Text>
            <Text style={[s.headerSub, { color: "#A78BFA" }]}>
              {cycleNameForDate(now)}
            </Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddOpen(true); }}
            style={[s.addBtn, { backgroundColor: "#7C3AED22", borderColor: "#7C3AED55" }]}
          >
            <Feather name="plus" size={16} color="#A78BFA" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active count summary */}
          {activeCount > 0 && (
            <View style={[s.summaryBanner, { backgroundColor: "#7C3AED12", borderColor: "#7C3AED33" }]}>
              <Text style={[s.summaryTxt, { color: "#A78BFA" }]}>
                {activeCount} active intention{activeCount !== 1 ? "s" : ""} this cycle
              </Text>
            </View>
          )}

          {/* Current cycle */}
          {currentIntentions.length === 0 ? (
            <View style={[s.emptyState, { borderColor: colors.border }]}>
              <Text style={s.emptyGlyph}>✦</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No intentions yet</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                Set an intention for {cycleNameForDate(now)} — something you wish to call into being this cycle.
              </Text>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddOpen(true); }}
                style={[s.emptyBtn, { backgroundColor: "#7C3AED", }]}
              >
                <Text style={s.emptyBtnTxt}>Set Your First Intention</Text>
              </Pressable>
            </View>
          ) : (
            currentIntentions.map((intention) => (
              <IntentionCard
                key={intention.id}
                intention={intention}
                colors={colors}
                onCheckIn={() => setCheckInTarget(intention)}
                onStatusChange={(status) => handleStatus(intention.id, status)}
                onDelete={() => handleDelete(intention.id)}
                onEdit={() => setEditTarget(intention)}
              />
            ))
          )}

          {/* Past intentions */}
          {pastIntentions.length > 0 && (
            <>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setShowPast((v) => !v); }}
                style={[s.pastToggle, { borderTopColor: colors.border }]}
              >
                <Text style={[s.pastToggleTxt, { color: colors.mutedForeground }]}>
                  Past Intentions ({pastIntentions.length})
                </Text>
                <Feather
                  name={showPast ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.mutedForeground}
                />
              </Pressable>

              {showPast && pastIntentions.map((intention) => (
                <IntentionCard
                  key={intention.id}
                  intention={intention}
                  colors={colors}
                  onCheckIn={() => setCheckInTarget(intention)}
                  onStatusChange={(status) => handleStatus(intention.id, status)}
                  onDelete={() => handleDelete(intention.id)}
                  onEdit={() => setEditTarget(intention)}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Bottom add button */}
        {currentIntentions.length > 0 && (
          <View style={[s.footer, { borderTopColor: colors.border, paddingBottom: 32 }]}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setAddOpen(true); }}
              style={[s.footerBtn, { backgroundColor: "#7C3AED" }]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={s.footerBtnTxt}>New Intention</Text>
            </Pressable>
          </View>
        )}
      </View>

      <AddIntentionModal
        visible={addOpen}
        onSave={handleAdd}
        onClose={() => setAddOpen(false)}
      />

      <CheckInModal
        visible={checkInTarget !== null}
        intentionText={checkInTarget?.text ?? ""}
        onSave={handleCheckIn}
        onClose={() => setCheckInTarget(null)}
      />

      <EditIntentionModal
        visible={editTarget !== null}
        intention={editTarget}
        onSave={handleEdit}
        onClose={() => setEditTarget(null)}
      />
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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  summaryBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryTxt: { fontSize: 13, fontWeight: "600" },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  emptyGlyph: { fontSize: 28, color: "#7C3AED" },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  intentionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statusStripe: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    gap: 6,
  },
  statusDot: { fontSize: 11 },
  statusLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, flex: 1 },
  cycleBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cycleBadgeTxt: { fontSize: 10, fontWeight: "600" },
  checkInCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  checkInCountTxt: { fontSize: 10, fontWeight: "600" },
  intentionText: {
    fontSize: 15,
    lineHeight: 24,
    padding: 14,
  },
  checkInsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  checkInsToggleTxt: { fontSize: 12 },
  checkInsList: {
    borderTopWidth: 1,
    padding: 14,
    gap: 10,
  },
  checkInItem: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    gap: 3,
  },
  checkInText: { fontSize: 13, lineHeight: 21 },
  checkInDate: { fontSize: 10 },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  actionBtnTxt: { fontSize: 12, fontWeight: "600" },
  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  pastToggleTxt: { fontSize: 13 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  footerBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
