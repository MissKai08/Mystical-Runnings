import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ViewSwitcher, CalendarView } from "@/components/ViewSwitcher";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";
import { ScheduleView } from "@/components/ScheduleView";
import { AlmanacView } from "@/components/AlmanacView";
import { SearchBar } from "@/components/SearchBar";
import {
  getStartOfWeek,
  SABBATS,
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
  OSE_GROUPS,
  EVENT_COLORS,
  EventType,
} from "@/constants/spiritualData";
import {
  RELIGIOUS_HOLIDAYS,
  HOLIDAY_REGION_COLOR,
  HOLIDAY_REGION_LABEL,
  HOLIDAY_REGION_FLAG,
  type HolidayRegion,
} from "@/constants/religiousHolidays";
import * as Haptics from "expo-haptics";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { loadEntries, type JournalEntry } from "@/utils/journalStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, TextInput, Alert } from "react-native";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalSearchResult {
  id: string;
  name: string;
  date: Date;
  description: string;
  color: string;
  type: EventType;
}

const SEARCH_INDEX: CalSearchResult[] = [
  ...SABBATS.map((s, i) => ({
    id: `sabbat-${i}`,
    name: s.name,
    date: s.date,
    description: s.description,
    color: EVENT_COLORS.sabbat,
    type: "sabbat" as EventType,
  })),
  ...NAMED_FULL_MOONS.map((m, i) => ({
    id: `named-moon-${i}`,
    name: m.name,
    date: m.date,
    description: m.description,
    color: EVENT_COLORS["named-moon"],
    type: "named-moon" as EventType,
  })),
  ...DARK_MOONS.map((m, i) => ({
    id: `dark-moon-${i}`,
    name: `Dark Moon · ${m.sign ?? ""}`,
    date: m.date,
    description: m.description,
    color: EVENT_COLORS["dark-moon"],
    type: "dark-moon" as EventType,
  })),
  ...ECLIPSES.map((e, i) => ({
    id: `eclipse-${i}`,
    name: e.name,
    date: e.date,
    description: e.description,
    color: EVENT_COLORS[e.type],
    type: e.type,
  })),
  ...IFA_FESTIVALS.map((f, i) => ({
    id: `festival-${i}`,
    name: f.name,
    date: f.date,
    description: f.description,
    color: EVENT_COLORS["ifa-festival"],
    type: "ifa-festival" as EventType,
  })),
  ...MERCURY_RETROGRADES.map((r, i) => ({
    id: `retro-${i}`,
    name: "Mercury Retrograde",
    date: r.start,
    description: `${r.label} · ends ${r.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    color: EVENT_COLORS.retrograde,
    type: "retrograde" as EventType,
  })),
  // Ose Calendar — compute the next occurrence of each of the 4 groups from today
  ...(() => {
    const anchor = new Date(2026, 3, 26);
    anchor.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const MS_DAY = 1000 * 60 * 60 * 24;
    const todayIdx = ((Math.round((today.getTime() - anchor.getTime()) / MS_DAY) % 4) + 4) % 4;
    return OSE_GROUPS.map((g) => {
      const daysUntil = ((g.dayIndex - todayIdx) + 4) % 4;
      const next = new Date(today);
      next.setDate(next.getDate() + daysUntil);
      return {
        id: `ose-${g.id}`,
        name: g.name,
        date: next,
        description: g.shortOrisas,
        color: g.color,
        type: "ose-day" as EventType,
      };
    });
  })(),
].sort((a, b) => a.date.getTime() - b.date.getTime());

const ALL_REGIONS: HolidayRegion[] = ["us", "mexico", "india", "jewish"];
const REGION_LABEL: Record<HolidayRegion, string> = {
  us: "US", mexico: "Mexico", india: "India", jewish: "Jewish",
};

interface SpecialCalendarEntry {
  id: string;
  title: string;
  date: string;
  category: string;
  note?: string;
}

const SPECIAL_CALENDAR_KEY = "@mystical_special_calendar_entries";

async function loadSpecialCalendarEntries(): Promise<SpecialCalendarEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SPECIAL_CALENDAR_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpecialCalendarEntry[];
  } catch {
    return [];
  }
}

async function saveSpecialCalendarEntries(entries: SpecialCalendarEntry[]): Promise<void> {
  await AsyncStorage.setItem(SPECIAL_CALENDAR_KEY, JSON.stringify(entries));
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [calView, setCalView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayDate, setDisplayDate] = useState<Date>(new Date());
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialEntries, setSpecialEntries] = useState<SpecialCalendarEntry[]>([]);
  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [specialTitle, setSpecialTitle] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [specialDate, setSpecialDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [specialCategory, setSpecialCategory] = useState("Loved One");
  const [enabledRegions, setEnabledRegions] = useState<Set<HolidayRegion>>(
    new Set(ALL_REGIONS)
  );

  const toggleRegion = (region: HolidayRegion) => {
    Haptics.selectionAsync();
    setEnabledRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const weekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);

  useEffect(() => {
    loadEntries().then(setJournalEntries);
    loadSpecialCalendarEntries().then(setSpecialEntries);
  }, []);

  const journaledDates = useMemo(() => {
    const s = new Set<string>();
    for (const e of journalEntries) s.add(e.date);
    return s;
  }, [journalEntries]);

  const journalMoonColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of journalEntries) {
      const p = (e.moonPhase ?? "").toLowerCase();
      let color = "#34D399";
      if (p.includes("full"))              color = "#D4A843";
      else if (p.includes("new") || p.includes("dark")) color = "#7C3AED";
      else if (p.includes("waxing crescent"))  color = "#C4B5FD";
      else if (p.includes("first quarter"))    color = "#A78BFA";
      else if (p.includes("waxing gibbous"))   color = "#9333EA";
      else if (p.includes("waning gibbous"))   color = "#F59E0B";
      else if (p.includes("last quarter"))     color = "#22D3EE";
      else if (p.includes("waning crescent"))  color = "#38BDF8";
      map[e.date] = color;
    }
    return map;
  }, [journalEntries]);

  const birthdayNameForDate = useMemo(() => {
    if (!profile) return undefined;
    const d = selectedDate;
    if (d.getMonth() + 1 === profile.birthMonth && d.getDate() === profile.birthDay) {
      return profile.firstName;
    }
    return undefined;
  }, [profile, selectedDate]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_INDEX;
    const q = searchQuery.toLowerCase();
    return SEARCH_INDEX.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handlePrev = () => {
    Haptics.selectionAsync();
    const d = new Date(displayDate);
    if (calView === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (calView === "week") {
      d.setDate(d.getDate() - 7);
      setSelectedDate(new Date(d));
    } else if (calView === "day") {
      d.setDate(d.getDate() - 1);
      setSelectedDate(new Date(d));
    } else {
      d.setDate(d.getDate() - 30);
    }
    setDisplayDate(d);
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    const d = new Date(displayDate);
    if (calView === "month") {
      d.setMonth(d.getMonth() + 1);
    } else if (calView === "week") {
      d.setDate(d.getDate() + 7);
      setSelectedDate(new Date(d));
    } else if (calView === "day") {
      d.setDate(d.getDate() + 1);
      setSelectedDate(new Date(d));
    } else {
      d.setDate(d.getDate() + 30);
    }
    setDisplayDate(d);
  };

  const handleToday = () => {
    Haptics.selectionAsync();
    const today = new Date();
    setSelectedDate(today);
    setDisplayDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setDisplayDate(date);
    if (calView === "month") setCalView("day");
  };

  const handleSearchResultPress = (result: CalSearchResult) => {
    Haptics.selectionAsync();
    setSelectedDate(result.date);
    setDisplayDate(result.date);
    setCalView("day");
    setSearchMode(false);
    setSearchQuery("");
  };

  const handleSaveSpecialEntry = async () => {
    if (!specialTitle.trim()) {
      Alert.alert("Missing title", "Add a name or special occasion.");
      return;
    }
    const entry: SpecialCalendarEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: specialTitle.trim(),
      date: specialDate,
      category: specialCategory.trim() || "Loved One",
      note: specialNote.trim() || undefined,
    };
    const next = [entry, ...specialEntries].sort((a, b) => a.date.localeCompare(b.date));
    setSpecialEntries(next);
    await saveSpecialCalendarEntries(next);
    setSpecialModalOpen(false);
    setSpecialTitle("");
    setSpecialNote("");
  };

  const openSearch = () => {
    Haptics.selectionAsync();
    setSearchMode(true);
  };

  const closeSearch = () => {
    setSearchMode(false);
    setSearchQuery("");
  };

  const headerTitle = useMemo(() => {
    if (calView === "month") return `${MONTH_NAMES[month]} ${year}`;
    if (calView === "week") {
      const ws = getStartOfWeek(displayDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      if (ws.getMonth() === we.getMonth()) {
        return `${MONTH_NAMES[ws.getMonth()]} ${ws.getFullYear()}`;
      }
      return `${MONTH_NAMES[ws.getMonth()]} – ${MONTH_NAMES[we.getMonth()]} ${ws.getFullYear()}`;
    }
    if (calView === "day") {
      return displayDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return "Upcoming Events";
  }, [calView, displayDate, month, year]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        {searchMode ? (
          <View style={styles.searchRow}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events, moons, sabbats…"
              autoFocus
            />
            <Pressable onPress={closeSearch} style={styles.cancelBtn} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Pressable onPress={handlePrev} style={styles.navBtn} hitSlop={8}>
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={handleToday} style={styles.titleWrap}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>{headerTitle}</Text>
            </Pressable>
            <Pressable onPress={openSearch} style={styles.navBtn} hitSlop={8}>
              <Feather name="search" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={handleNext} style={styles.navBtn} hitSlop={8}>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => setSpecialModalOpen(true)} style={styles.navBtn} hitSlop={8}>
              <Feather name="plus" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        )}
      </View>

      {searchMode ? (
        /* Search Results */
        <ScrollView
          style={styles.searchResults}
          contentContainerStyle={styles.searchResultsContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchQuery.length > 0 && (
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {searchResults.length} event{searchResults.length === 1 ? "" : "s"} found
            </Text>
          )}
          {searchQuery.length === 0 && (
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              All notable events · tap to jump to date
            </Text>
          )}
          {searchResults.length === 0 && searchQuery.length > 0 && (
            <View style={styles.noResults}>
              <Feather name="search" size={32} color={colors.mutedForeground} />
              <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
                No events match "{searchQuery}"
              </Text>
            </View>
          )}
          {searchResults.map((result) => (
            <Pressable
              key={result.id}
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
              onPress={() => handleSearchResultPress(result)}
            >
              <View style={[styles.resultDot, { backgroundColor: result.color }]} />
              <View style={styles.resultText}>
                <Text style={[styles.resultName, { color: colors.foreground }]}>{result.name}</Text>
                <Text style={[styles.resultDate, { color: "#D4A843" }]}>
                  {result.date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text style={[styles.resultDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {result.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <>
          {/* View Switcher */}
          <ViewSwitcher mode={calView} onModeChange={setCalView} />

          {/* Holiday Region Filter */}
          {calView !== "almanac" && (
            <View style={styles.regionFilter}>
              {ALL_REGIONS.map((region) => {
                const active = enabledRegions.has(region);
                return (
                  <Pressable
                    key={region}
                    onPress={() => toggleRegion(region)}
                    style={[
                      styles.regionChip,
                      {
                        backgroundColor: active ? HOLIDAY_REGION_COLOR[region] + "22" : "transparent",
                        borderColor: active ? HOLIDAY_REGION_COLOR[region] : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.regionChipFlag}>{HOLIDAY_REGION_FLAG[region]}</Text>
                    <Text style={[styles.regionChipLabel, { color: active ? HOLIDAY_REGION_COLOR[region] : colors.mutedForeground }]}>
                      {REGION_LABEL[region]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Calendar Content */}
          <View style={styles.calendarContent}>
            {calView === "month" && (
              <View style={styles.monthPad}>
                <MonthView
                  year={year}
                  month={month}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  enabledRegions={enabledRegions}
                  birthdayMonth={profile?.birthMonth}
                  birthdayDay={profile?.birthDay}
                  journaledDates={journaledDates}
                  journalMoonColors={journalMoonColors}
                />
              </View>
            )}
            {calView === "week" && (
              <WeekView
                startDate={weekStart}
                selectedDate={selectedDate}
                onSelectDate={(d) => { setSelectedDate(d); setDisplayDate(d); }}
                enabledRegions={enabledRegions}
              />
            )}
            {calView === "day" && <DayView date={selectedDate} birthdayName={birthdayNameForDate} />}
            {calView === "schedule" && <ScheduleView startDate={displayDate} enabledRegions={enabledRegions} />}
            {calView === "almanac" && <AlmanacView />}
          {specialEntries.length > 0 && calView !== "almanac" && (
            <View style={styles.specialSection}>
              <Text style={[styles.specialHeading, { color: colors.mutedForeground }]}>SPECIAL DAYS</Text>
              {specialEntries.filter((e) => {
                const [y, m, d] = e.date.split("-").map(Number);
                const target = new Date(y, m - 1, d);
                return calView === "month"
                  ? target.getMonth() === month && target.getFullYear() === year
                  : calView === "week"
                    ? target >= weekStart && target <= new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
                    : calView === "day"
                      ? target.toDateString() === selectedDate.toDateString()
                      : true;
              }).map((e) => (
                <View key={e.id} style={[styles.specialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.specialDate, { color: "#D4A843" }]}>{e.date}</Text>
                  <Text style={[styles.specialTitle, { color: colors.foreground }]}>{e.title}</Text>
                  <Text style={[styles.specialCategory, { color: colors.mutedForeground }]}>{e.category}{e.note ? ` · ${e.note}` : ""}</Text>
                </View>
              ))}
            </View>
          )}
          </View>
      <Modal visible={specialModalOpen} transparent animationType="slide" onRequestClose={() => setSpecialModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Calendar Entry</Text>
            <TextInput value={specialTitle} onChangeText={setSpecialTitle} placeholder="Birthday, anniversary, transition date..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={specialCategory} onChangeText={setSpecialCategory} placeholder="Loved One / Ancestor / Family" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={specialNote} onChangeText={setSpecialNote} placeholder="Optional note" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <Pressable onPress={handleSaveSpecialEntry} style={styles.saveSpecialBtn}><Text style={styles.saveSpecialText}>Save</Text></Pressable>
            <Pressable onPress={() => setSpecialModalOpen(false)} style={styles.cancelSpecialBtn}><Text style={[styles.cancelSpecialText, { color: colors.mutedForeground }]}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>

          {/* Legend */}
          <Legend bottomPad={Platform.OS === "web" ? 34 : insets.bottom + 8} />
        </>
      )}
    </View>
  );
}

const LEGEND_GROUPS = [
  {
    heading: "Moon",
    items: [
      { color: "#A78BFA", label: "Full / Named Moon" },
      { color: "#4C1D95", label: "Dark Moon" },
    ],
  },
  {
    heading: "Celestial",
    items: [
      { color: "#F59E0B", label: "Solar Eclipse" },
      { color: "#EC4899", label: "Lunar Eclipse" },
      { color: "#34D399", label: "Sabbat / Solstice" },
      { color: "#F97316", label: "Mercury Retrograde" },
    ],
  },
  {
    heading: "Ifa",
    items: [
      { color: "#D4A843", label: "Ifa Prayer Day" },
      { color: "#22D3EE", label: "Ifa Festival" },
    ],
  },
  {
    heading: "Ose Calendar",
    items: [
      { color: "#E8D5A0", label: "Ose Obatala" },
      { color: "#D4A843", label: "Ose Ifa" },
      { color: "#94A3B8", label: "Ose Ogun" },
      { color: "#EF4444", label: "Ose Sango" },
    ],
  },
  {
    heading: "Holidays",
    items: [
      { color: "#3B82F6", label: "🇺🇸 U.S. Holiday" },
      { color: "#22C55E", label: "🇲🇽 Mexican Holiday" },
      { color: "#F97316", label: "🇮🇳 Indian Holiday" },
      { color: "#60A5FA", label: "✡️ Jewish Holiday" },
    ],
  },
  {
    heading: "Journal",
    items: [
      { color: "#D4A843", label: "Full Moon entry" },
      { color: "#7C3AED", label: "New / Dark Moon entry" },
      { color: "#A78BFA", label: "Quarter Moon entry" },
      { color: "#34D399", label: "Other phase entry" },
    ],
  },
];

function Legend({ bottomPad }: { bottomPad: number }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.legendWrap, { borderTopColor: colors.border, paddingBottom: bottomPad }]}>
      <Pressable
        style={styles.legendToggle}
        onPress={() => { Haptics.selectionAsync(); setExpanded((e) => !e); }}
        hitSlop={8}
      >
        {!expanded && (
          <View style={styles.legendCollapsed}>
            {LEGEND_GROUPS.flatMap((g) => g.items).map((item, i) => (
              <View key={i} style={styles.legendDotWrap}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              </View>
            ))}
            <Text style={[styles.legendToggleLabel, { color: colors.mutedForeground }]}>Legend</Text>
            <Feather name="chevron-up" size={13} color={colors.mutedForeground} />
          </View>
        )}
        {expanded && (
          <View style={styles.legendExpanded}>
            <View style={styles.legendExpandedHeader}>
              <Text style={[styles.legendExpandedTitle, { color: colors.foreground }]}>Calendar Legend</Text>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </View>
            {LEGEND_GROUPS.map((group) => (
              <View key={group.heading} style={styles.legendGroup}>
                <Text style={[styles.legendGroupLabel, { color: colors.mutedForeground }]}>
                  {group.heading.toUpperCase()}
                </Text>
                <View style={styles.legendGroupItems}>
                  {group.items.map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.legendLabel, { color: colors.foreground }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  specialSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  specialHeading: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  specialCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  specialDate: { fontSize: 11, fontWeight: "700" },
  specialTitle: { fontSize: 15, fontWeight: "700" },
  specialCategory: { fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveSpecialBtn: {
    backgroundColor: "#D4A843",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveSpecialText: { color: "#080714", fontWeight: "800" },
  cancelSpecialBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelSpecialText: { fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navBtn: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  regionFilter: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  regionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  regionChipFlag: {
    fontSize: 12,
  },
  regionChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  calendarContent: { flex: 1 },
  monthPad: {
    paddingHorizontal: 8,
    flex: 1,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultCount: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingVertical: 10,
  },
  noResults: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
  },
  resultDate: {
    fontSize: 12,
    fontWeight: "600",
  },
  resultDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  legendWrap: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  legendToggle: { width: "100%" },
  legendCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  legendDotWrap: { alignItems: "center", justifyContent: "center" },
  legendToggleLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginLeft: 4,
  },
  legendExpanded: { paddingBottom: 4 },
  legendExpandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  legendExpandedTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  legendGroup: { marginBottom: 10 },
  legendGroupLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  legendGroupItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: "45%",
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});
