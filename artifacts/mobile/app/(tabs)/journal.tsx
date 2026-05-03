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
  loadFreezes,
  addFreeze,
  removeFreeze,
  MOODS,
  ENTRY_TAGS,
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
  getOseDay,
  ODU_REFLECTIONS,
} from "@/constants/spiritualData";
import { getDailyWisdom } from "@/constants/dailyWisdom";
import { DrawingCanvas, DrawingCanvasRef } from "@/components/DrawingCanvas";
import { SearchBar } from "@/components/SearchBar";
import SacredAltar from "@/components/SacredAltar";
import LunarLetterModal from "@/components/LunarLetterModal";
import { generateLunarLetter, LunarLetterData } from "@/utils/lunarLetter";
import IntentionsModal from "@/components/IntentionsModal";
import Svg, { Path } from "react-native-svg";

type InputMode = "text" | "drawing";

function getSpiritualContextForDate(date: Date): { moonPhase: string; context: string[] } {
  const moon = getMoonPhaseData(date);
  const context: string[] = [];
  const nm = getNamedFullMoonForDate(date);
  const dm = getDarkMoonForDate(date);
  const ec = getEclipseForDate(date);
  const sb = getSabbatForDate(date);
  const rt = getMercuryRetrogradeInfo(date);
  const pr = isIfaPrayerDay(date);
  const fv = getIfaFestivalForDate(date);
  if (nm) context.push(nm.name);
  else if (dm) context.push(`Dark Moon · ${dm.sign ?? ""}`);
  else if (moon.isMajorPhase) context.push(moon.name);
  if (ec) context.push(ec.name);
  if (sb) context.push(sb.name.split(" —")[0]);
  if (rt) context.push("Mercury Retrograde");
  if (pr) context.push("Ifa Prayer Day");
  if (fv) context.push(fv.name);
  const ose = getOseDay(date);
  context.push(ose.name);
  return { moonPhase: nm?.name ?? moon.name, context };
}

function lunarPhaseStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const written = new Set(entries.map((e) => e.date));
  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hasNear = (d: Date) => {
    for (let offset = -1; offset <= 1; offset++) {
      const c = new Date(d);
      c.setDate(c.getDate() + offset);
      if (written.has(keyOf(c))) return true;
    }
    return false;
  };
  const today = new Date();
  const cursor = new Date(today);
  cursor.setHours(12, 0, 0, 0);
  let streak = 0;
  let scanned = 0;
  while (scanned < 300) {
    if (cursor.getTime() <= today.getTime()) {
      const m = getMoonPhaseData(cursor);
      if (m.isMajorPhase) {
        if (hasNear(cursor)) streak++;
        else break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
    scanned++;
  }
  return streak;
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

function WeekStrip({ entries, freezes, colors }: { entries: JournalEntry[]; freezes: Set<string>; colors: ReturnType<typeof useColors> }) {
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
      isFrozen: !written.has(key) && freezes.has(key),
    };
  });

  return (
    <View style={stripStyles.row}>
      {days.map((day, i) => (
        <View key={i} style={stripStyles.col}>
          <Text style={[
            stripStyles.letter,
            { color: day.isToday ? "#D4A843" : day.isFrozen ? "#93C5FD" : colors.mutedForeground,
              opacity: day.isFuture ? 0.3 : 1 }
          ]}>
            {day.letter}
          </Text>
          <View style={[
            stripStyles.dot,
            day.hasEntry
              ? { backgroundColor: "#D4A843", borderColor: "#D4A843" }
              : day.isFrozen
              ? { backgroundColor: "#1D4ED822", borderColor: "#93C5FD", borderWidth: 1.5 }
              : day.isToday
              ? { backgroundColor: "transparent", borderColor: "#D4A843", borderWidth: 1.5 }
              : { backgroundColor: "transparent", borderColor: day.isFuture ? "#1E1A3A" : "#2D2650", opacity: day.isFuture ? 0.3 : 1 },
          ]}>
            {day.isFrozen
              ? <Text style={stripStyles.freezeGlyph}>❄</Text>
              : day.isToday && !day.hasEntry
              ? <View style={stripStyles.todayCore} />
              : null
            }
          </View>
          <Text style={[
            stripStyles.dateNum,
            { color: day.isToday ? "#D4A843" : day.isFrozen ? "#93C5FD" : colors.mutedForeground,
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
  freezeGlyph: {
    fontSize: 6,
    color: "#93C5FD",
  },
  dateNum: {
    fontSize: 9,
  },
});

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const ENTRY_COLORS = ["#13102A", "#D4A84330", "#D4A84358", "#D4A84385", "#D4A843AA"];

const MOON_PROMPTS: Record<string, string[]> = {
  "new-moon": [
    "What seeds of intention are you planting as this new cycle begins?",
    "If this moon cycle were a chapter in your life, what title would you give it?",
    "What do you wish to call into being before the next full moon?",
  ],
  "waxing-crescent": [
    "What small action today moved you closer to your intentions?",
    "Where do you feel growth stirring — in your body, your heart, your practice?",
    "What new belief is trying to take root within you right now?",
  ],
  "first-quarter": [
    "What obstacle is asking you to push through it right now?",
    "Where are you being called to make a decision and fully commit?",
    "What fear is standing between you and the intention you set at the new moon?",
  ],
  "waxing-gibbous": [
    "What needs to be refined or adjusted to bring your intentions to fruition?",
    "Where are you almost there — and what final push is being asked of you?",
    "What would completion feel like in your body? Describe it in detail.",
  ],
  "full-moon": [
    "What is illuminated in your life right now that you can no longer look away from?",
    "What are you releasing tonight — a pattern, a story, a weight you've been carrying?",
    "What do you have genuine gratitude for as this cycle reaches its peak?",
  ],
  "named-moon": [
    "What is this moon's name and energy calling forth in you?",
    "What ancestral or seasonal wisdom is available to you in this moment?",
    "What do you wish to receive as the moon reaches its fullest expression?",
  ],
  "waning-gibbous": [
    "What wisdom from this cycle are you now called to share or embody?",
    "How have you changed since the new moon? What has visibly shifted?",
    "What are you grateful you did — or chose not to do — this cycle?",
  ],
  "last-quarter": [
    "What habit, belief, or pattern are you truly ready to release before the next cycle?",
    "What forgiveness — of yourself or another — is waiting to be offered right now?",
    "What no longer belongs in the next chapter of your life?",
  ],
  "waning-crescent": [
    "As this cycle closes, what do you need to rest, restore, or surrender?",
    "What quiet truth has this moon cycle whispered to you when you were still enough to hear?",
    "What will you do differently when the new moon rises?",
  ],
  "dark-moon": [
    "What lives in your shadow that is asking to be witnessed — not fixed, just seen?",
    "In the void before the new cycle, what are you being invited to release completely?",
    "What does your deepest self need right now — rest, truth, or honest darkness?",
  ],
};

const OSE_SUFFIXES: Record<string, string> = {
  obatala: "Sit in stillness with your answer. Obatala asks for patience and clarity before action.",
  ifa: "Seek the deeper pattern beneath your words. Ifa reminds you wisdom arrives before speaking.",
  ogun: "Let your answer lead to one clear action. Ogun moves through purpose, not hesitation.",
  sango: "Write boldly and without softening. Sango's thunder clears the air for what is real.",
};

function getMoonPromptType(date: Date): string {
  if (getNamedFullMoonForDate(date)) return "named-moon";
  if (getDarkMoonForDate(date)) return "dark-moon";
  return getMoonPhaseData(date).eventType;
}

function MonthHeatmap({
  entries, freezes, year, month, onPrev, onNext, onDayPress, onEmptyDayPress, colors,
}: {
  entries: JournalEntry[];
  freezes: Set<string>;
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onDayPress?: (date: string) => void;
  onEmptyDayPress?: (date: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      const [ey, em] = e.date.split("-").map(Number);
      if (ey === year && em === month + 1) m.set(e.date, (m.get(e.date) ?? 0) + 1);
    }
    return m;
  }, [entries, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Math.floor(cells.length / 7);

  const dayKey = (day: number) =>
    `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  return (
    <View style={heatStyles.container}>
      <View style={heatStyles.nav}>
        <Pressable onPress={onPrev} hitSlop={10} style={heatStyles.navBtn}>
          <Feather name="chevron-left" size={15} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[heatStyles.monthTitle, { color: colors.foreground }]}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Pressable onPress={onNext} hitSlop={10} style={heatStyles.navBtn}>
          <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={heatStyles.gridRow}>
        {DAY_LETTERS.map((l, i) => (
          <Text key={i} style={[heatStyles.gridLetter, { color: colors.mutedForeground }]}>{l}</Text>
        ))}
      </View>

      {Array.from({ length: weeks }, (_, row) => (
        <View key={row} style={heatStyles.gridRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            const count = day ? (countMap.get(dayKey(day)) ?? 0) : 0;
            const dk = day ? dayKey(day) : "";
            const isFrozen = day !== null && count === 0 && freezes.has(dk);
            const bg = isFrozen
              ? "#1D4ED818"
              : day ? ENTRY_COLORS[Math.min(count, ENTRY_COLORS.length - 1)] : "transparent";
            const isToday = day ? dk === todayStr : false;
            const textColor = count > 0 ? "#D4A843" : isFrozen ? "#93C5FD" : colors.mutedForeground;
            const isPast = day !== null && dk <= todayStr;
            const tappable = day !== null && count > 0;
            const emptyTappable = day !== null && count === 0 && isPast && !isToday;
            return (
              <Pressable
                key={col}
                disabled={!tappable && !emptyTappable}
                onPress={
                  tappable ? () => onDayPress?.(dayKey(day!))
                  : emptyTappable ? () => onEmptyDayPress?.(dayKey(day!))
                  : undefined
                }
                style={({ pressed }) => [
                  heatStyles.cell,
                  { backgroundColor: bg },
                  isToday && { borderWidth: 1.5, borderColor: "#D4A843" },
                  isFrozen && { borderWidth: 1, borderColor: "#93C5FD55" },
                  (tappable || emptyTappable) && pressed && { opacity: 0.55 },
                  !isFrozen && emptyTappable && { borderColor: "#2D2650", borderWidth: 1 },
                ]}
              >
                {day !== null && (
                  isFrozen ? (
                    <Text style={heatStyles.freezeGlyph}>❄</Text>
                  ) : (
                    <Text style={[
                      heatStyles.cellText,
                      { color: textColor, fontWeight: isToday ? "800" : "400" },
                    ]}>
                      {day}
                    </Text>
                  )
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const heatStyles = StyleSheet.create({
  container: { gap: 3, paddingTop: 8 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  gridRow: { flexDirection: "row" },
  gridLetter: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    paddingBottom: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 1.5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontSize: 9 },
  freezeGlyph: { fontSize: 8, color: "#93C5FD" },
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

function JournalDatePicker({
  selectedDate,
  pickerYear,
  pickerMonth,
  onPrev,
  onNext,
  onSelect,
  colors,
}: {
  selectedDate: string;
  pickerYear: number;
  pickerMonth: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (date: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const startOffset = new Date(pickerYear, pickerMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Math.floor(cells.length / 7);
  const dayKey = (day: number) =>
    `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isNextDisabled =
    pickerYear > today.getFullYear() ||
    (pickerYear === today.getFullYear() && pickerMonth >= today.getMonth());

  return (
    <View style={[dpStyles.container, { borderBottomColor: colors.border }]}>
      <View style={dpStyles.nav}>
        <Pressable onPress={onPrev} hitSlop={10} style={dpStyles.navBtn}>
          <Feather name="chevron-left" size={15} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[dpStyles.monthTitle, { color: colors.foreground }]}>
          {MONTH_NAMES[pickerMonth]} {pickerYear}
        </Text>
        <Pressable
          onPress={isNextDisabled ? undefined : onNext}
          hitSlop={10}
          style={[dpStyles.navBtn, { opacity: isNextDisabled ? 0.3 : 1 }]}
        >
          <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={dpStyles.gridRow}>
        {DAY_LETTERS.map((l, i) => (
          <Text key={i} style={[dpStyles.gridLetter, { color: colors.mutedForeground }]}>{l}</Text>
        ))}
      </View>
      {Array.from({ length: weeks }, (_, row) => (
        <View key={row} style={dpStyles.gridRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={dpStyles.cell} />;
            const dk = dayKey(day);
            const isSelected = dk === selectedDate;
            const isToday = dk === todayStr;
            const isFuture = dk > todayStr;
            return (
              <Pressable
                key={col}
                disabled={isFuture}
                onPress={() => onSelect(dk)}
                style={({ pressed }) => [
                  dpStyles.cell,
                  isSelected && { backgroundColor: "#D4A843" },
                  !isSelected && isToday && { borderWidth: 1.5, borderColor: "#D4A843" },
                  !isFuture && !isSelected && pressed && { backgroundColor: "#D4A84322" },
                  isFuture && { opacity: 0.2 },
                ]}
              >
                <Text style={[
                  dpStyles.cellText,
                  { color: isSelected ? "#080714" : isToday ? "#D4A843" : colors.foreground },
                  isSelected && { fontWeight: "800" },
                ]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 2 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 13, fontWeight: "700" },
  gridRow: { flexDirection: "row" },
  gridLetter: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    paddingBottom: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 1.5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontSize: 11, fontWeight: "500" },
});

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
  const [calMode, setCalMode] = useState<"week" | "month">("week");
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const [composerDate, setComposerDate] = useState<string | null>(null);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [freezes, setFreezes] = useState<Set<string>>(new Set());
  const [lunarLetterOpen, setLunarLetterOpen] = useState(false);
  const [lunarLetterData, setLunarLetterData] = useState<LunarLetterData | null>(null);
  const [intentionsOpen, setIntentionsOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const offsetMap = useRef<Map<string, number>>(new Map());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);

  const drawingRef = useRef<DrawingCanvasRef>(null);

  const entryDate = useMemo(() => {
    if (!composerDate) return new Date();
    const [y, m, d] = composerDate.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }, [composerDate]);
  const entrySpiritualCtx = useMemo(() => getSpiritualContextForDate(entryDate), [entryDate]);

  useEffect(() => {
    loadEntries().then(setEntries);
    loadFreezes().then((arr) => setFreezes(new Set(arr)));
  }, []);

  const openComposer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setComposerDate(null);
    setSelectedMoods([]);
    setSelectedTags([]);
    setTextValue("");
    setInputMode("text");
    setShowDatePicker(false);
    drawingRef.current?.clear();
    // Seed prompt to a deterministic daily index so it varies day-to-day
    const now = new Date();
    setPickerYear(now.getFullYear());
    setPickerMonth(now.getMonth());
    setPromptIdx((now.getDate() + now.getMonth() * 31) % 3);
    setComposerOpen(true);
  };

  const openComposerForDate = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setComposerDate(date);
    setSelectedMoods([]);
    setSelectedTags([]);
    setTextValue("");
    setInputMode("text");
    setShowDatePicker(false);
    drawingRef.current?.clear();
    const [y, m, d] = date.split("-").map(Number);
    const parsedDate = new Date(y, m - 1, d);
    setPickerYear(parsedDate.getFullYear());
    setPickerMonth(parsedDate.getMonth());
    setPromptIdx((parsedDate.getDate() + parsedDate.getMonth() * 31) % 3);
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setComposerDate(null);
    setSelectedMoods([]);
    setSelectedTags([]);
    setShowDatePicker(false);
  };

  const toggleMood = (id: string) => {
    Haptics.selectionAsync();
    setSelectedMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
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
      date: composerDate ?? todayKey(),
      moonPhase: entrySpiritualCtx.moonPhase,
      spiritualContext: entrySpiritualCtx.context,
      mood: selectedMoods.length > 0 ? [...selectedMoods] : undefined,
      tags: selectedTags.length > 0 ? [...selectedTags] : undefined,
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

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handlePickerPrev = useCallback(() => {
    setPickerMonth((m) => {
      if (m === 0) { setPickerYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const handlePickerNext = useCallback(() => {
    const today = new Date();
    setPickerMonth((m) => {
      if (pickerYear < today.getFullYear() || (pickerYear === today.getFullYear() && m < today.getMonth())) {
        if (m === 11) { setPickerYear((y) => y + 1); return 0; }
        return m + 1;
      }
      return m;
    });
  }, [pickerYear]);

  const handlePickerSelect = useCallback((date: string) => {
    Haptics.selectionAsync();
    setComposerDate(date);
    setShowDatePicker(false);
    const [y, m, d] = date.split("-").map(Number);
    const parsedDate = new Date(y, m - 1, d);
    setPromptIdx((parsedDate.getDate() + parsedDate.getMonth() * 31) % 3);
  }, []);

  const handleEmptyDayPress = useCallback((date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (freezes.has(date)) {
      Alert.alert(
        "❄️ Streak Freeze",
        `${formatEntryDate(date)}\n\nThis day is frozen — it won't break your streak.`,
        [
          {
            text: "Remove Freeze",
            style: "destructive",
            onPress: async () => {
              await removeFreeze(date);
              setFreezes((prev) => { const next = new Set(prev); next.delete(date); return next; });
            },
          },
          { text: "Write Entry Instead", onPress: () => openComposerForDate(date) },
          { text: "Keep Freeze", style: "cancel" },
        ]
      );
    } else {
      Alert.alert(
        formatEntryDate(date),
        "What would you like to do?",
        [
          { text: "Write Entry", onPress: () => openComposerForDate(date) },
          {
            text: "❄️ Freeze This Day",
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await addFreeze(date);
              setFreezes((prev) => new Set([...prev, date]));
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  }, [freezes]);

  const handleDayPress = useCallback((date: string) => {
    const offset = offsetMap.current.get(date);
    if (offset !== undefined) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 16), animated: true });
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      setHighlightDate(date);
      highlightTimer.current = setTimeout(() => setHighlightDate(null), 2000);
    }
  }, []);

  const freezeArr = useMemo(() => [...freezes], [freezes]);
  const streak = useMemo(() => calculateStreak(entries, freezeArr), [entries, freezeArr]);
  const best = useMemo(() => longestStreak(entries, freezeArr), [entries, freezeArr]);
  const wroteToday = useMemo(() => entries.some((e) => e.date === todayKey()), [entries]);
  const lunarStreak = useMemo(() => lunarPhaseStreak(entries), [entries]);

  const handleOpenLunarLetter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date();
    setLunarLetterData(generateLunarLetter(now.getFullYear(), now.getMonth()));
    setLunarLetterOpen(true);
  }, []);

  const handleSaveLunarLetter = useCallback(async () => {
    if (!lunarLetterData) return;
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const ctx = getSpiritualContextForDate(now);
    const entry: JournalEntry = {
      id: `letter-${lunarLetterData.monthKey}-${Date.now()}`,
      date: dateKey,
      moonPhase: ctx.moonPhase,
      spiritualContext: ctx.context,
      inputType: "text",
      textContent: lunarLetterData.text,
      isLunarLetter: true,
      letterMonth: lunarLetterData.monthKey,
      createdAt: Date.now(),
    };
    await saveEntry(entry);
    const updated = await loadEntries();
    setEntries(updated);
  }, [lunarLetterData]);

  const lunarLetterSaved = useMemo(() => {
    if (!lunarLetterData) return false;
    return entries.some((e) => e.isLunarLetter && e.letterMonth === lunarLetterData.monthKey);
  }, [entries, lunarLetterData]);

  const todayWisdom = useMemo(() => getDailyWisdom(new Date()), []);

  const openComposerWithSeed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setComposerDate(null);
    setSelectedMoods([]);
    setSelectedTags([]);
    setTextValue(`"${todayWisdom.text}"\n— ${todayWisdom.source}\n\n`);
    setInputMode("text");
    drawingRef.current?.clear();
    const now = new Date();
    setPromptIdx((now.getDate() + now.getMonth() * 31) % 3);
    setComposerOpen(true);
  }, [todayWisdom]);

  const currentPrompts = useMemo(() => {
    const type = getMoonPromptType(entryDate);
    return MOON_PROMPTS[type] ?? MOON_PROMPTS["full-moon"];
  }, [entryDate]);

  const currentPrompt = useMemo(
    () => currentPrompts[promptIdx % currentPrompts.length],
    [currentPrompts, promptIdx]
  );

  const oseDay = useMemo(() => getOseDay(entryDate), [entryDate]);

  const currentOseSuffix = useMemo(
    () => OSE_SUFFIXES[oseDay.id] ?? "",
    [oseDay]
  );

  const entryOdu = useMemo(() => getDailyOdu(entryDate), [entryDate]);
  const oduReflection = useMemo(
    () => ODU_REFLECTIONS[entryOdu.name] ?? "How does the energy of this Odu show up in your life today?",
    [entryOdu]
  );

  const filteredEntries = entries.filter((e) => {
    if (moodFilter && !e.mood?.includes(moodFilter)) return false;
    if (tagFilter && !e.tags?.includes(tagFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.textContent ?? "").toLowerCase().includes(q) ||
      e.moonPhase.toLowerCase().includes(q) ||
      e.spiritualContext.some((c) => c.toLowerCase().includes(q)) ||
      (e.mood ?? []).some((m) => m.includes(q)) ||
      (e.tags ?? []).some((t) => t.includes(q)) ||
      e.date.includes(q)
    );
  });
  const grouped = groupEntriesByDate(filteredEntries);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Sacred Journal</Text>
          <View style={styles.badgeRow}>
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
            {lunarStreak >= 2 && (
              <View style={[styles.lunarStreakBadge, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED55" }]}>
                <Text style={styles.streakFlame}>
                  {lunarStreak >= 12 ? "🌕" : lunarStreak >= 8 ? "🌖" : lunarStreak >= 5 ? "🌓" : lunarStreak >= 3 ? "🌒" : "🌑"}
                </Text>
                <Text style={[styles.streakCount, { color: "#A78BFA" }]}>{lunarStreak}</Text>
                <Text style={[styles.streakDayLabel, { color: "#A78BFA" }]}>
                  {lunarStreak === 1 ? "phase" : "phases"}
                </Text>
              </View>
            )}
          </View>
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

        {/* Lunar Letter button */}
        <Pressable
          onPress={handleOpenLunarLetter}
          style={[styles.lunarLetterBtn, { backgroundColor: "#D4A84314", borderColor: "#D4A84344" }]}
        >
          <Text style={styles.lunarLetterBtnGlyph}>✦</Text>
          <Text style={[styles.lunarLetterBtnText, { color: "#D4A843" }]}>
            Lunar Letter — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <Feather name="chevron-right" size={14} color="#D4A84388" />
        </Pressable>

        {/* Sacred Intentions button */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIntentionsOpen(true); }}
          style={[styles.lunarLetterBtn, { backgroundColor: "#7C3AED14", borderColor: "#7C3AED44" }]}
        >
          <Text style={[styles.lunarLetterBtnGlyph, { color: "#A78BFA" }]}>○</Text>
          <Text style={[styles.lunarLetterBtnText, { color: "#A78BFA" }]}>
            Sacred Intentions
          </Text>
          <Feather name="chevron-right" size={14} color="#A78BFA88" />
        </Pressable>

        {/* Calendar mode toggle */}
        <View style={styles.calToggleRow}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setCalMode("week"); }}
            style={[styles.calToggleBtn, calMode === "week" && styles.calToggleBtnActive]}
          >
            <Text style={[styles.calToggleTxt, { color: calMode === "week" ? "#D4A843" : colors.mutedForeground }]}>
              Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setCalMode("month"); }}
            style={[styles.calToggleBtn, calMode === "month" && styles.calToggleBtnActive]}
          >
            <Text style={[styles.calToggleTxt, { color: calMode === "month" ? "#D4A843" : colors.mutedForeground }]}>
              Month
            </Text>
          </Pressable>
        </View>

        {calMode === "week"
          ? <WeekStrip entries={entries} freezes={freezes} colors={colors} />
          : <MonthHeatmap
              entries={entries}
              freezes={freezes}
              year={viewYear}
              month={viewMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              onDayPress={handleDayPress}
              onEmptyDayPress={handleEmptyDayPress}
              colors={colors}
            />
        }
      </View>

      {/* Single unified scroll — everything below the header scrolls together */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Mood filter strip */}
        {entries.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodFilterContent}
            style={[styles.moodFilterStrip, { borderBottomColor: colors.border }]}
          >
            {MOODS.map((m) => {
              const active = moodFilter === m.id;
              const hasSome = entries.some((e) => e.mood?.includes(m.id));
              if (!hasSome) return null;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => { Haptics.selectionAsync(); setMoodFilter(active ? null : m.id); }}
                  style={[
                    styles.moodFilterChip,
                    { borderColor: active ? m.color : colors.border },
                    active && { backgroundColor: m.color + "22" },
                  ]}
                >
                  <Text style={styles.moodFilterEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodFilterLabel, { color: active ? m.color : colors.mutedForeground }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
            {moodFilter && (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setMoodFilter(null); }}
                style={[styles.moodFilterChip, { borderColor: colors.border }]}
              >
                <Feather name="x" size={11} color={colors.mutedForeground} />
                <Text style={[styles.moodFilterLabel, { color: colors.mutedForeground }]}>Clear</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {/* Tag filter strip */}
        {entries.length > 0 && ENTRY_TAGS.some((t) => entries.some((e) => e.tags?.includes(t.id))) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodFilterContent}
            style={[styles.moodFilterStrip, { borderBottomColor: colors.border }]}
          >
            {ENTRY_TAGS.map((t) => {
              const active = tagFilter === t.id;
              const hasSome = entries.some((e) => e.tags?.includes(t.id));
              if (!hasSome) return null;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => { Haptics.selectionAsync(); setTagFilter(active ? null : t.id); }}
                  style={[
                    styles.moodFilterChip,
                    { borderColor: active ? t.color : colors.border },
                    active && { backgroundColor: t.color + "22" },
                  ]}
                >
                  <Text style={[styles.moodFilterLabel, { color: active ? t.color : colors.mutedForeground }]}>
                    # {t.label}
                  </Text>
                </Pressable>
              );
            })}
            {tagFilter && (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setTagFilter(null); }}
                style={[styles.moodFilterChip, { borderColor: colors.border }]}
              >
                <Feather name="x" size={11} color={colors.mutedForeground} />
                <Text style={[styles.moodFilterLabel, { color: colors.mutedForeground }]}>Clear</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {/* Today's Sacred Seed — visible when not searching */}
        {!searchQuery.trim() && (
          <View style={[styles.listSeedCard, { backgroundColor: colors.card, borderColor: "#7C3AED33" }]}>
            <View style={styles.listSeedHeader}>
              <Text style={[styles.listSeedLabel, { color: "#A78BFA" }]}>✦ TODAY'S SACRED SEED</Text>
              <Pressable
                onPress={openComposerWithSeed}
                style={[styles.listSeedBtn, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED44" }]}
              >
                <Feather name="edit-3" size={11} color="#A78BFA" />
                <Text style={[styles.listSeedBtnText, { color: "#A78BFA" }]}>Write on This</Text>
              </Pressable>
            </View>
            <Text style={[styles.listSeedText, { color: colors.foreground }]}>"{todayWisdom.text}"</Text>
            <Text style={[styles.listSeedSource, { color: colors.mutedForeground }]}>— {todayWisdom.source}</Text>
          </View>
        )}

        {/* Sacred Altar */}
        {!searchQuery.trim() && <SacredAltar collapsed />}

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
              No entries match "{searchQuery || tagFilter || moodFilter || ""}"
            </Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {grouped.map(({ date, entries: dayEntries }) => (
              <View
                key={date}
                style={[
                  styles.dateGroup,
                  highlightDate === date && styles.dateGroupHighlight,
                ]}
                onLayout={(e) => { offsetMap.current.set(date, e.nativeEvent.layout.y); }}
              >
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
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {entries.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: "#D4A843", bottom: bottomPad + 80 }]}
          onPress={openComposer}
        >
          <Feather name="edit-3" size={22} color="#080714" />
        </Pressable>
      )}

      {/* Sacred Intentions Modal */}
      <IntentionsModal
        visible={intentionsOpen}
        onClose={() => setIntentionsOpen(false)}
      />

      {/* Lunar Letter Modal */}
      <LunarLetterModal
        visible={lunarLetterOpen}
        letter={lunarLetterData}
        alreadySaved={lunarLetterSaved}
        onSave={handleSaveLunarLetter}
        onClose={() => setLunarLetterOpen(false)}
      />

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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {composerDate ? "Past Entry" : "New Entry"}
              </Text>
              {composerDate ? (
                <Text style={[styles.modalDate, { color: "#D4A843" }]}>
                  {formatEntryDate(composerDate)}
                </Text>
              ) : (
                <Text style={[styles.modalDate, { color: "#D4A843" }]}>
                  {entrySpiritualCtx.moonPhase}
                </Text>
              )}
            </View>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: "#D4A843", opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
          {/* Entry date selector row */}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setShowDatePicker((v) => !v); }}
            style={[styles.datePickerRow, { borderBottomColor: colors.border, backgroundColor: showDatePicker ? "#D4A84309" : "transparent" }]}
          >
            <Feather name="calendar" size={13} color="#D4A843" />
            <Text style={[styles.datePickerLabel, { color: colors.foreground }]}>
              {composerDate ? formatEntryDate(composerDate) : formatEntryDate(todayKey())}
            </Text>
            <Text style={[styles.datePickerMoon, { color: colors.mutedForeground }]}>
              {entrySpiritualCtx.moonPhase}
            </Text>
            <Feather name={showDatePicker ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
          </Pressable>

          {/* Inline date picker */}
          {showDatePicker && (
            <JournalDatePicker
              selectedDate={composerDate ?? todayKey()}
              pickerYear={pickerYear}
              pickerMonth={pickerMonth}
              onPrev={handlePickerPrev}
              onNext={handlePickerNext}
              onSelect={handlePickerSelect}
              colors={colors}
            />
          )}

          {/* Spiritual context chips */}
          {entrySpiritualCtx.context.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contextChips}
              style={[styles.contextRow, { borderBottomColor: colors.border }]}
            >
              {entrySpiritualCtx.context.map((c, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Sacred Seed — wisdom connected to the Odu wisdom cycle */}
          {inputMode === "text" && (
            <View style={[styles.seedCard, { backgroundColor: "#7C3AED09", borderColor: "#7C3AED33" }]}>
              <Text style={[styles.seedLabel, { color: "#A78BFA" }]}>✦ TODAY'S SACRED SEED</Text>
              <Text style={[styles.seedText, { color: colors.foreground }]}>"{todayWisdom.text}"</Text>
              <Text style={[styles.seedSource, { color: colors.mutedForeground }]}>— {todayWisdom.source}</Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (textValue.trim().length === 0) {
                    setTextValue(`"${todayWisdom.text}"\n— ${todayWisdom.source}\n\n`);
                  }
                }}
                style={[
                  styles.seedUseBtn,
                  { borderColor: "#7C3AED44", opacity: textValue.trim().length > 0 ? 0.4 : 1 },
                ]}
              >
                <Feather name="feather" size={12} color="#A78BFA" />
                <Text style={[styles.seedUseBtnText, { color: "#A78BFA" }]}>
                  {textValue.trim().length > 0 ? "Seed used" : "Use as opening"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Daily Journal Prompt */}
          {inputMode === "text" && (
            <View style={[styles.promptCard, { backgroundColor: "#D4A84309", borderColor: "#D4A84333" }]}>
              <View style={styles.promptHeader}>
                <Text style={[styles.promptLabel, { color: "#D4A843" }]}>✦ TODAY'S PROMPT</Text>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPromptIdx((i) => (i + 1) % currentPrompts.length);
                  }}
                  hitSlop={10}
                  style={styles.promptRefreshBtn}
                >
                  <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <Text style={[styles.promptText, { color: colors.foreground }]}>
                {currentPrompt}
              </Text>
              <Text style={[styles.promptSuffix, { color: colors.mutedForeground }]}>
                {currentOseSuffix}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (textValue.trim().length === 0) setTextValue(currentPrompt + "\n\n");
                }}
                style={[
                  styles.promptUseBtn,
                  { borderColor: "#D4A84344", opacity: textValue.trim().length > 0 ? 0.4 : 1 },
                ]}
              >
                <Feather name="edit-3" size={12} color="#D4A843" />
                <Text style={[styles.promptUseBtnText, { color: "#D4A843" }]}>
                  {textValue.trim().length > 0 ? "Prompt used" : "Use this prompt"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Odu Reflection Prompt */}
          {inputMode === "text" && (
            <View style={[styles.oduPromptCard, { backgroundColor: "#D4A84309", borderColor: "#D4A84344" }]}>
              <View style={styles.oduPromptHeader}>
                <View style={styles.oduPromptTitleRow}>
                  <Text style={[styles.oduPromptLabel, { color: "#D4A843" }]}>✦ IFA CONSULTATION</Text>
                  <Text style={[styles.oduPromptOduName, { color: colors.mutedForeground }]}>
                    {entryOdu.symbol} · {entryOdu.name}
                  </Text>
                </View>
              </View>
              <Text style={[styles.oduPromptText, { color: colors.foreground }]}>
                {oduReflection}
              </Text>
              <Text style={[styles.oduPromptOrisha, { color: colors.mutedForeground }]}>
                {entryOdu.orisha} · {entryOdu.element}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (textValue.trim().length === 0)
                    setTextValue(oduReflection + "\n\n");
                }}
                style={[
                  styles.oduPromptUseBtn,
                  { borderColor: "#D4A84344", opacity: textValue.trim().length > 0 ? 0.4 : 1 },
                ]}
              >
                <Text style={[styles.oduPromptUseBtnText, { color: "#D4A843" }]}>
                  {textValue.trim().length > 0 ? "Used as prompt" : "Begin with this question"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Mood / energy selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodSelectorContent}
            style={[styles.moodSelectorRow, { borderBottomColor: colors.border }]}
          >
            {MOODS.map((m) => {
              const active = selectedMoods.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMood(m.id)}
                  style={[
                    styles.moodPill,
                    { borderColor: active ? m.color : colors.border },
                    active && { backgroundColor: m.color + "22" },
                  ]}
                >
                  <Text style={styles.moodPillEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodPillLabel, { color: active ? m.color : colors.mutedForeground }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Tag selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodSelectorContent}
            style={[styles.moodSelectorRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.tagSelectorLabel, { color: colors.mutedForeground }]}>#</Text>
            {ENTRY_TAGS.map((t) => {
              const active = selectedTags.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTags((prev) =>
                      prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                    );
                  }}
                  style={[
                    styles.tagPill,
                    { borderColor: active ? t.color : colors.border },
                    active && { backgroundColor: t.color + "22" },
                  ]}
                >
                  <Text style={[styles.tagPillText, { color: active ? t.color : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

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
              style={[styles.textInput, { color: colors.foreground }]}
              placeholder="Write your reflection, intention, or insight…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              scrollEnabled={false}
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
          </ScrollView>
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
    <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: entry.isLunarLetter ? "#D4A84366" : colors.border }]}>
      {/* Lunar Letter banner */}
      {entry.isLunarLetter && (
        <View style={[styles.lunarLetterCardBanner, { backgroundColor: "#D4A84318", borderBottomColor: "#D4A84333" }]}>
          <Text style={styles.lunarLetterCardGlyph}>✦</Text>
          <Text style={[styles.lunarLetterCardTitle, { color: "#D4A843" }]}>Lunar Letter</Text>
          {entry.letterMonth && (
            <Text style={[styles.lunarLetterCardMonth, { color: "#A08030" }]}>
              · {entry.letterMonth.replace(/^(\d{4})-(\d{2})$/, (_, y, m) =>
                new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              )}
            </Text>
          )}
        </View>
      )}

      {/* Card header */}
      <View style={styles.entryCardHeader}>
        <View style={styles.entryMeta}>
          <View style={[styles.entryTypeBadge, {
            backgroundColor: entry.isLunarLetter ? "#D4A84322" : entry.inputType === "drawing" ? "#7C3AED22" : "#D4A84322",
            borderColor: entry.isLunarLetter ? "#D4A84355" : entry.inputType === "drawing" ? "#7C3AED55" : "#D4A84355",
          }]}>
            <Feather
              name={entry.isLunarLetter ? "mail" : entry.inputType === "drawing" ? "edit-2" : "type"}
              size={10}
              color={entry.isLunarLetter ? "#D4A843" : entry.inputType === "drawing" ? "#A78BFA" : "#D4A843"}
            />
            <Text style={[styles.entryTypeLabel, { color: entry.isLunarLetter ? "#D4A843" : entry.inputType === "drawing" ? "#A78BFA" : "#D4A843" }]}>
              {entry.isLunarLetter ? "Lunar Letter" : entry.inputType === "drawing" ? "Handwritten" : "Text"}
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

      {/* Mood badges */}
      {(entry.mood ?? []).length > 0 && (
        <View style={styles.moodBadgeRow}>
          {(entry.mood ?? []).map((id) => {
            const m = MOODS.find((x) => x.id === id);
            if (!m) return null;
            return (
              <View key={id} style={[styles.moodBadge, { borderColor: m.color + "66", backgroundColor: m.color + "18" }]}>
                <Text style={styles.moodBadgeEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodBadgeLabel, { color: m.color }]}>{m.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Tag badges */}
      {(entry.tags ?? []).length > 0 && (
        <View style={styles.moodBadgeRow}>
          {(entry.tags ?? []).map((id) => {
            const t = ENTRY_TAGS.find((x) => x.id === id);
            if (!t) return null;
            return (
              <View key={id} style={[styles.tagBadge, { borderColor: t.color + "66", backgroundColor: t.color + "18" }]}>
                <Text style={[styles.tagBadgeText, { color: t.color }]}># {t.label}</Text>
              </View>
            );
          })}
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  lunarStreakBadge: {
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
  dateGroupHighlight: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4A84355",
    backgroundColor: "#D4A84309",
    paddingHorizontal: 6,
    marginHorizontal: -6,
  },
  calToggleRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    backgroundColor: "#0F0D20",
    borderRadius: 8,
    padding: 2,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2D2650",
  },
  calToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calToggleBtnActive: {
    backgroundColor: "#1E1A3A",
  },
  calToggleTxt: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  datePickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  datePickerMoon: {
    fontSize: 11,
  },
  moodSelectorRow: {
    borderBottomWidth: 1,
    maxHeight: 52,
  },
  moodSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moodPillEmoji: { fontSize: 14 },
  moodPillLabel: { fontSize: 11, fontWeight: "600" },
  moodBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  moodBadgeEmoji: { fontSize: 11 },
  moodBadgeLabel: { fontSize: 10, fontWeight: "600" },
  moodFilterStrip: {
    borderBottomWidth: 1,
    maxHeight: 48,
  },
  moodFilterContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
  },
  moodFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  moodFilterEmoji: { fontSize: 12 },
  moodFilterLabel: { fontSize: 10, fontWeight: "600" },
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
  promptCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  promptRefreshBtn: {
    padding: 2,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    fontWeight: "500",
  },
  promptSuffix: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  promptUseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  promptUseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    minHeight: 240,
    padding: 16,
    fontSize: 16,
    lineHeight: 26,
    borderTopWidth: 0,
    borderWidth: 0,
    borderRadius: 0,
  },
  drawingArea: {
    height: 380,
  },
  listSeedCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  listSeedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listSeedLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  listSeedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listSeedBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  listSeedText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 6,
  },
  listSeedSource: {
    fontSize: 11,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  seedCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  seedLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  seedText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    fontWeight: "500",
  },
  seedSource: {
    fontSize: 11,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  seedUseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  seedUseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  oduPromptCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  oduPromptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  oduPromptTitleRow: {
    gap: 2,
    flex: 1,
  },
  oduPromptLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  oduPromptOduName: {
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  oduPromptText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    fontWeight: "500",
  },
  oduPromptOrisha: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  oduPromptUseBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  oduPromptUseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  lunarLetterBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
  },
  lunarLetterBtnGlyph: {
    fontSize: 14,
    color: "#D4A843",
  },
  lunarLetterBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  lunarLetterCardBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  lunarLetterCardGlyph: {
    fontSize: 13,
    color: "#D4A843",
  },
  lunarLetterCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  lunarLetterCardMonth: {
    fontSize: 12,
    fontWeight: "500",
  },
  tagSelectorLabel: {
    fontSize: 14,
    fontWeight: "700",
    alignSelf: "center",
    marginRight: 4,
    opacity: 0.5,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
