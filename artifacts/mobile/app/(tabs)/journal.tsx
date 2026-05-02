import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import {
  JournalEntry,
  loadEntries,
  saveEntry,
  deleteEntry,
  generateId,
  todayKey,
  formatEntryDate,
  calculateStreak,
  longestStreak,
} from "@/utils/journalStorage";
import {
  getMoonPhaseData,
  getSabbatForDate,
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getEclipseForDate,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getDailyOdu,
} from "@/constants/spiritualData";
import { DrawingCanvas, DrawingCanvasRef } from "@/components/DrawingCanvas";
import { SearchBar } from "@/components/SearchBar";
import Svg, { Path } from "react-native-svg";

type InputMode = "text" | "drawing";

function getTodaySpiritualContext(): { moonPhase: string; context: string[] } {
  const today = new Date();
  const moon = getMoonPhaseData(today);
  const context: string[] = [];
  const nm = getNamedFullMoonForDate(today);
  const dm = getDarkMoonForDate(today);
  const ec = getEclipseForDate(today);
  const sb = getSabbatForDate(today);
  const rt = getMercuryRetrogradeInfo(today);
  const pr = isIfaPrayerDay(today);
  const fv = getIfaFestivalForDate(today);
  if (nm) context.push(nm.name);
  else if (dm) context.push(`Dark Moon · ${dm.sign ?? ""}`);
  else if (moon.isMajorPhase) context.push(moon.name);
  if (ec) context.push(ec.name);
  if (sb) context.push(sb.name.split(" —")[0]);
  if (rt) context.push("Mercury Retrograde");
  if (pr) context.push("Ifa Prayer Day");
  if (fv) context.push(fv.name);
  return { moonPhase: nm?.name ?? moon.name, context };
}

function groupEntriesByDate(entries: JournalEntry[]): { date: string; entries: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({ date, entries }));
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function WeekStrip({ entries, colors }: { entries: JournalEntry[]; colors: ReturnType<typeof useColors> }) {
  const written = new Set(entries.map((e) => e.date));
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  sunday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      key,
      letter: DAY_LETTERS[i],
      dateNum: d.getDate(),
      isToday: key === todayStr,
      isFuture: d > today && key !== todayStr,
      hasEntry: written.has(key),
    };
  });

  return (
    <View style={stripStyles.row}>
      {days.map((day, i) => (
        <View key={i} style={stripStyles.col}>
          <Text style={[
            stripStyles.letter,
            { color: day.isToday ? "#D4A843" : colors.mutedForeground,
              opacity: day.isFuture ? 0.3 : 1 }
          ]}>
            {day.letter}
          </Text>
          <View style={[
            stripStyles.dot,
            day.hasEntry
              ? { backgroundColor: "#D4A843", borderColor: "#D4A843" }
              : day.isToday
              ? { backgroundColor: "transparent", borderColor: "#D4A843", borderWidth: 1.5 }
              : { backgroundColor: "transparent", borderColor: day.isFuture ? "#1E1A3A" : "#2D2650", opacity: day.isFuture ? 0.3 : 1 },
          ]}>
            {day.isToday && !day.hasEntry && (
              <View style={stripStyles.todayCore} />
            )}
          </View>
          <Text style={[
            stripStyles.dateNum,
            { color: day.isToday ? "#D4A843" : colors.mutedForeground,
              fontWeight: day.isToday ? "700" : "400",
              opacity: day.isFuture ? 0.35 : 1 }
          ]}>
            {day.dateNum}
          </Text>
        </View>
      ))}
    </View>
  );
}

const stripStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  col: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  letter: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4A843",
  },
  dateNum: {
    fontSize: 9,
  },
});

function DrawingThumbnail({ data, size = 80 }: { data: { paths: string[]; width: number; height: number }; size?: number }) {
  const scaleX = size / (data.width || 1);
  const scaleY = (size * 0.75) / (data.height || 1);
  const scale = Math.min(scaleX, scaleY);
  return (
    <Svg width={size} height={size * 0.75} style={{ borderRadius: 6, backgroundColor: "#0D0B1E" }}>
      {data.paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke="#D4A843"
          strokeWidth={2.5 / scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform={`scale(${scale})`}
        />
      ))}
    </Svg>
  );
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textValue, setTextValue] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const drawingRef = useRef<DrawingCanvasRef>(null);
  const spiritualCtx = getTodaySpiritualContext();

  useEffect(() => {
    loadEntries().then(setEntries);
  }, []);

  const openComposer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTextValue("");
    setInputMode("text");
    drawingRef.current?.clear();
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
  };

  const handleSave = async () => {
    const hasText = inputMode === "text" && textValue.trim().length > 0;
    const hasDrawing = inputMode === "drawing" && (drawingRef.current?.getPaths() ?? []).length > 0;
    if (!hasText && !hasDrawing) {
      Alert.alert("Nothing to save", "Add some text or a drawing before saving.");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry: JournalEntry = {
      id: generateId(),
      date: todayKey(),
      moonPhase: spiritualCtx.moonPhase,
      spiritualContext: spiritualCtx.context,
      inputType: inputMode,
      textContent: inputMode === "text" ? textValue.trim() : undefined,
      drawingData:
        inputMode === "drawing"
          ? {
              paths: drawingRef.current?.getPaths() ?? [],
              width: canvasSize.width,
              height: canvasSize.height,
            }
          : undefined,
      createdAt: Date.now(),
    };
    await saveEntry(entry);
    const updated = await loadEntries();
    setEntries(updated);
    setSaving(false);
    setComposerOpen(false);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Entry", "Remove this journal entry permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEntry(id);
          setEntries((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  const handleCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setCanvasSize({ width, height });
  }, []);

  const streak = useMemo(() => calculateStreak(entries), [entries]);
  const best = useMemo(() => longestStreak(entries), [entries]);
  const wroteToday = useMemo(() => entries.some((e) => e.date === todayKey()), [entries]);

  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) => {
        const q = searchQuery.toLowerCase();
        return (
          (e.textContent ?? "").toLowerCase().includes(q) ||
          e.moonPhase.toLowerCase().includes(q) ||
          e.spiritualContext.some((c) => c.toLowerCase().includes(q)) ||
          e.date.includes(q)
        );
      })
    : entries;
  const grouped = groupEntriesByDate(filteredEntries);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Sacred Journal</Text>
          {streak > 0 && (
            <View style={[styles.streakBadge, {
              backgroundColor: wroteToday ? "#D4A84322" : "#D4A84314",
              borderColor: wroteToday ? "#D4A84366" : "#D4A84333",
            }]}>
              <Text style={styles.streakFlame}>{wroteToday ? "🔥" : "✦"}</Text>
              <Text style={[styles.streakCount, { color: wroteToday ? "#D4A843" : "#A08030" }]}>
                {streak}
              </Text>
              <Text style={[styles.streakDayLabel, { color: wroteToday ? "#D4A843" : "#A08030" }]}>
                {streak === 1 ? "day" : "days"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerBottomRow}>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            {entries.length === 0
              ? "Your reflections begin here"
              : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
          </Text>
          {best > 1 && (
            <Text style={[styles.bestStreakLabel, { color: colors.mutedForeground }]}>
              best {best}
            </Text>
          )}
        </View>

        <WeekStrip entries={entries} colors={colors} />
      </View>

      {/* Search bar */}
      {entries.length > 0 && (
        <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search entries, moon phases, events…"
          />
          {searchQuery.length > 0 && (
            <Text style={[styles.searchCount, { color: colors.mutedForeground }]}>
              {filteredEntries.length} result{filteredEntries.length === 1 ? "" : "s"}
            </Text>
          )}
        </View>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>✦</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Begin Your Practice</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Record intentions, divination insights, dreams, and reflections — tied to the moon and the sacred calendar.
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: "#D4A84322", borderColor: "#D4A84355" }]}
            onPress={openComposer}
          >
            <Feather name="edit-3" size={16} color="#D4A843" />
            <Text style={[styles.emptyBtnText, { color: "#D4A843" }]}>Write First Entry</Text>
          </Pressable>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Results</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No entries match "{searchQuery}"
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(({ date, entries: dayEntries }) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: colors.mutedForeground }]}>
                {formatEntryDate(date).toUpperCase()}
              </Text>
              {dayEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  colors={colors}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      {entries.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: "#D4A843", bottom: bottomPad + 80 }]}
          onPress={openComposer}
        >
          <Feather name="edit-3" size={22} color="#080714" />
        </Pressable>
      )}

      {/* Composer Modal */}
      <Modal visible={composerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeComposer}>
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: Platform.OS === "ios" ? 16 : 20 }]}>
            <Pressable onPress={closeComposer} style={styles.modalClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
            <View style={styles.modalTitleWrap}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Entry</Text>
              <Text style={[styles.modalDate, { color: "#D4A843" }]}>
                {spiritualCtx.moonPhase}
              </Text>
            </View>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: "#D4A843", opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>

          {/* Spiritual context chips */}
          {spiritualCtx.context.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contextChips}
              style={[styles.contextRow, { borderBottomColor: colors.border }]}
            >
              {spiritualCtx.context.map((c, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Mode toggle */}
          <View style={[styles.modeRow, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable
              style={[styles.modeBtn, inputMode === "text" && { borderBottomColor: "#D4A843", borderBottomWidth: 2 }]}
              onPress={() => { Haptics.selectionAsync(); setInputMode("text"); }}
            >
              <Feather name="type" size={16} color={inputMode === "text" ? "#D4A843" : colors.mutedForeground} />
              <Text style={[styles.modeBtnLabel, { color: inputMode === "text" ? "#D4A843" : colors.mutedForeground }]}>
                Keyboard
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, inputMode === "drawing" && { borderBottomColor: "#A78BFA", borderBottomWidth: 2 }]}
              onPress={() => { Haptics.selectionAsync(); setInputMode("drawing"); }}
            >
              <Feather name="edit-2" size={16} color={inputMode === "drawing" ? "#A78BFA" : colors.mutedForeground} />
              <Text style={[styles.modeBtnLabel, { color: inputMode === "drawing" ? "#A78BFA" : colors.mutedForeground }]}>
                Handwrite
              </Text>
            </Pressable>
          </View>

          {/* Input area */}
          {inputMode === "text" ? (
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Write your reflection, intention, or insight…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
              value={textValue}
              onChangeText={setTextValue}
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.drawingArea} onLayout={handleCanvasLayout}>
              {canvasSize.width > 0 && (
                <DrawingCanvas
                  ref={drawingRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  strokeColor="#D4A843"
                  strokeWidth={2.5}
                />
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EntryCard({ entry, colors, onDelete }: { entry: JournalEntry; colors: ReturnType<typeof useColors>; onDelete: () => void }) {
  const time = new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Derive Odu from the entry date — deterministic, works for all existing entries
  const entryOdu = useMemo(() => {
    const [y, m, d] = entry.date.split("-").map(Number);
    return getDailyOdu(new Date(y, m - 1, d));
  }, [entry.date]);

  const moonEmoji = moonPhaseEmoji(entry.moonPhase);

  return (
    <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Card header */}
      <View style={styles.entryCardHeader}>
        <View style={styles.entryMeta}>
          <View style={[styles.entryTypeBadge, {
            backgroundColor: entry.inputType === "drawing" ? "#7C3AED22" : "#D4A84322",
            borderColor: entry.inputType === "drawing" ? "#7C3AED55" : "#D4A84355",
          }]}>
            <Feather
              name={entry.inputType === "drawing" ? "edit-2" : "type"}
              size={10}
              color={entry.inputType === "drawing" ? "#A78BFA" : "#D4A843"}
            />
            <Text style={[styles.entryTypeLabel, { color: entry.inputType === "drawing" ? "#A78BFA" : "#D4A843" }]}>
              {entry.inputType === "drawing" ? "Handwritten" : "Text"}
            </Text>
          </View>
          <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>{time}</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Lunar history row — moon phase + Odu stamped on the entry */}
      <View style={[styles.lunarHistoryRow, { backgroundColor: "#0D0B1E", borderColor: "#1E1A3A" }]}>
        <View style={styles.lunarHistoryItem}>
          <Text style={[styles.lunarHistoryLabel, { color: colors.mutedForeground }]}>MOON</Text>
          <View style={styles.lunarHistoryValue}>
            <Text style={styles.lunarHistoryEmoji}>{moonEmoji}</Text>
            <Text style={[styles.lunarHistoryText, { color: "#A78BFA" }]} numberOfLines={1}>
              {entry.moonPhase}
            </Text>
          </View>
        </View>
        <View style={[styles.lunarHistoryDivider, { backgroundColor: "#1E1A3A" }]} />
        <View style={styles.lunarHistoryItem}>
          <Text style={[styles.lunarHistoryLabel, { color: colors.mutedForeground }]}>ODU</Text>
          <View style={styles.lunarHistoryValue}>
            <Text style={styles.lunarHistoryEmoji}>✦</Text>
            <Text style={[styles.lunarHistoryText, { color: "#D4A843" }]} numberOfLines={1}>
              {entryOdu.name}
            </Text>
          </View>
        </View>
        <View style={[styles.lunarHistoryDivider, { backgroundColor: "#1E1A3A" }]} />
        <View style={styles.lunarHistoryItem}>
          <Text style={[styles.lunarHistoryLabel, { color: colors.mutedForeground }]}>ORISHA</Text>
          <Text style={[styles.lunarHistoryText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {entryOdu.orisha}
          </Text>
        </View>
      </View>

      {/* Context chips */}
      {entry.spiritualContext.length > 0 && (
        <View style={styles.entryChips}>
          {entry.spiritualContext.slice(0, 3).map((c, i) => (
            <View key={i} style={[styles.entryChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.entryChipText, { color: colors.mutedForeground }]}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Content preview */}
      {entry.inputType === "text" && entry.textContent && (
        <Text style={[styles.entryTextPreview, { color: colors.foreground }]} numberOfLines={4}>
          {entry.textContent}
        </Text>
      )}
      {entry.inputType === "drawing" && entry.drawingData && (
        <View style={styles.drawingPreview}>
          <DrawingThumbnail data={entry.drawingData} size={120} />
          <Text style={[styles.drawingStrokesLabel, { color: colors.mutedForeground }]}>
            {entry.drawingData.paths.length} stroke{entry.drawingData.paths.length === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </View>
  );
}

function moonPhaseEmoji(phase: string): string {
  const p = phase.toLowerCase();
  if (p.includes("new") || p.includes("dark")) return "🌑";
  if (p.includes("waxing crescent")) return "🌒";
  if (p.includes("first quarter")) return "🌓";
  if (p.includes("waxing gibbous")) return "🌔";
  if (p.includes("full")) return "🌕";
  if (p.includes("waning gibbous")) return "🌖";
  if (p.includes("last quarter")) return "🌗";
  if (p.includes("waning crescent")) return "🌘";
  return "🌙";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  streakDayLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  bestStreakLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  entryCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  entryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entryTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  entryTime: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
  lunarHistoryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  lunarHistoryItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 3,
    alignItems: "center",
  },
  lunarHistoryLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  lunarHistoryValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  lunarHistoryEmoji: {
    fontSize: 11,
  },
  lunarHistoryText: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  lunarHistoryDivider: {
    width: 1,
    marginVertical: 6,
  },
  entryMoon: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  entryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  entryChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entryChipText: {
    fontSize: 10,
    fontWeight: "500",
  },
  entryTextPreview: {
    fontSize: 14,
    lineHeight: 21,
  },
  drawingPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  drawingStrokesLabel: {
    fontSize: 12,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  searchCount: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    paddingLeft: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalClose: {
    padding: 4,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    color: "#080714",
    fontWeight: "700",
    fontSize: 14,
  },
  contextRow: {
    borderBottomWidth: 1,
    maxHeight: 44,
  },
  contextChips: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  modeRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
  },
  modeBtnLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 26,
    borderTopWidth: 0,
    borderWidth: 0,
  },
  drawingArea: {
    flex: 1,
  },
});
