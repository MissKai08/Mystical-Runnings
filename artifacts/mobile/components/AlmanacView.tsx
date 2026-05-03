import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  getMoonPhaseData,
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
  SABBATS,
  isSameDay,
  EVENT_COLORS,
  EventType,
} from "@/constants/spiritualData";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface AlmanacEntry {
  date: Date;
  label: string;
  sublabel?: string;
  color: string;
  emoji: string;
  type: EventType | string;
  isToday: boolean;
}

function buildYearEntries(year: number, today: Date): AlmanacEntry[] {
  const entries: AlmanacEntry[] = [];

  const namedMoonKeys = new Set(
    NAMED_FULL_MOONS.filter((m) => m.date.getFullYear() === year)
      .map((m) => `${m.date.getMonth()}-${m.date.getDate()}`)
  );
  const darkMoonKeys = new Set(
    DARK_MOONS.filter((m) => m.date.getFullYear() === year)
      .map((m) => `${m.date.getMonth()}-${m.date.getDate()}`)
  );

  // Named full moons
  for (const m of NAMED_FULL_MOONS) {
    if (m.date.getFullYear() !== year) continue;
    entries.push({
      date: m.date,
      label: m.name,
      sublabel: m.sign ? `Full Moon in ${m.sign}` : "Full Moon",
      color: EVENT_COLORS["named-moon"],
      emoji: "🌕",
      type: "named-moon",
      isToday: isSameDay(m.date, today),
    });
  }

  // Dark moons — also note New Moon if algorithm agrees
  for (const m of DARK_MOONS) {
    if (m.date.getFullYear() !== year) continue;
    const phaseData = getMoonPhaseData(m.date);
    const isAlsoNewMoon = phaseData.isMajorPhase && phaseData.eventType === "new-moon";
    entries.push({
      date: m.date,
      label: isAlsoNewMoon ? "Dark Moon · New Moon" : "Dark Moon",
      sublabel: m.sign ? `in ${m.sign}` : undefined,
      color: EVENT_COLORS["dark-moon"],
      emoji: "🌑",
      type: "dark-moon",
      isToday: isSameDay(m.date, today),
    });
  }

  // All computed major phases not covered by named/dark moon lists
  const cursor = new Date(year, 0, 1);
  cursor.setHours(12, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 12, 0, 0);
  while (cursor <= yearEnd) {
    const m = getMoonPhaseData(cursor);
    if (m.isMajorPhase) {
      const k = `${cursor.getMonth()}-${cursor.getDate()}`;
      if (!namedMoonKeys.has(k) && !darkMoonKeys.has(k)) {
        const emoji =
          m.eventType === "new-moon" ? "🌑"
          : m.eventType === "first-quarter" ? "🌓"
          : m.eventType === "full-moon" ? "🌕"
          : "🌗";
        entries.push({
          date: new Date(cursor),
          label: m.name,
          sublabel: `${m.illumination}% illuminated`,
          color: EVENT_COLORS[m.eventType],
          emoji,
          type: m.eventType,
          isToday: isSameDay(cursor, today),
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Eclipses
  for (const e of ECLIPSES) {
    if (e.date.getFullYear() !== year) continue;
    entries.push({
      date: e.date,
      label: e.name,
      sublabel: e.description,
      color: EVENT_COLORS[e.type],
      emoji: e.type === "solar-eclipse" ? "☀️" : "🌙",
      type: e.type,
      isToday: isSameDay(e.date, today),
    });
  }

  // Sabbats
  for (const s of SABBATS) {
    if (s.date.getFullYear() !== year) continue;
    const shortName = s.name.split(" —")[0];
    const subtitle = s.description;
    entries.push({
      date: s.date,
      label: shortName,
      sublabel: subtitle,
      color: EVENT_COLORS.sabbat,
      emoji: "✦",
      type: "sabbat",
      isToday: isSameDay(s.date, today),
    });
  }

  // Mercury Retrograde — start and end
  for (const r of MERCURY_RETROGRADES) {
    if (r.start.getFullYear() === year) {
      entries.push({
        date: r.start,
        label: "Mercury Retrograde begins",
        sublabel: r.label,
        color: EVENT_COLORS.retrograde,
        emoji: "☿",
        type: "retrograde",
        isToday: isSameDay(r.start, today),
      });
    }
    if (r.end.getFullYear() === year) {
      entries.push({
        date: r.end,
        label: "Mercury Retrograde ends",
        sublabel: r.label,
        color: EVENT_COLORS.retrograde,
        emoji: "☿",
        type: "retrograde",
        isToday: isSameDay(r.end, today),
      });
    }
  }

  // Ifa Festivals
  for (const f of IFA_FESTIVALS) {
    if (f.date.getFullYear() !== year) continue;
    entries.push({
      date: f.date,
      label: f.name,
      sublabel: f.description,
      color: EVENT_COLORS["ifa-festival"],
      emoji: "✦",
      type: "ifa-festival",
      isToday: isSameDay(f.date, today),
    });
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface MonthGroup {
  month: number;
  year: number;
  entries: AlmanacEntry[];
}

function groupByMonth(entries: AlmanacEntry[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const e of entries) {
    const k = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    if (!map.has(k)) {
      map.set(k, { month: e.date.getMonth(), year: e.date.getFullYear(), entries: [] });
    }
    map.get(k)!.entries.push(e);
  }
  return Array.from(map.values()).sort(
    (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month)
  );
}

export function AlmanacView() {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();

  const allEntries = useMemo(() => buildYearEntries(year, today), [year]);
  const months = useMemo(() => groupByMonth(allEntries), [allEntries]);

  const scrollRef = useRef<ScrollView>(null);
  const todayOffset = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (todayOffset.current !== null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, todayOffset.current - 48), animated: false });
      }
    }, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.yearHeader, { color: colors.mutedForeground }]}>
        {year} Spiritual Almanac
      </Text>

      {months.map((group) => {
        const isCurrentMonth =
          group.month === today.getMonth() && group.year === today.getFullYear();
        return (
          <View
            key={`${group.year}-${group.month}`}
            onLayout={(e) => {
              if (isCurrentMonth && todayOffset.current === null) {
                todayOffset.current = e.nativeEvent.layout.y;
              }
            }}
          >
            {/* Month section header */}
            <View style={[styles.monthHeader, { borderBottomColor: colors.border }]}>
              <Text
                style={[
                  styles.monthName,
                  { color: isCurrentMonth ? "#D4A843" : colors.foreground },
                ]}
              >
                {MONTH_NAMES[group.month].toUpperCase()}
              </Text>
              {isCurrentMonth && (
                <View style={styles.nowBadge}>
                  <Text style={styles.nowBadgeText}>NOW</Text>
                </View>
              )}
              <Text style={[styles.monthEntryCount, { color: colors.mutedForeground }]}>
                {group.entries.length} event{group.entries.length === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Entries */}
            {group.entries.map((entry, i) => (
              <View
                key={i}
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                  entry.isToday && { backgroundColor: "#D4A84309" },
                ]}
              >
                {/* Date column */}
                <View style={styles.dateCol}>
                  <Text
                    style={[
                      styles.dayName,
                      { color: entry.isToday ? "#D4A843" : colors.mutedForeground },
                    ]}
                  >
                    {DAY_NAMES[entry.date.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: entry.isToday ? "#D4A843" : colors.foreground },
                    ]}
                  >
                    {entry.date.getDate()}
                  </Text>
                  {entry.isToday && <View style={styles.todayDot} />}
                </View>

                {/* Color accent bar */}
                <View style={[styles.accentBar, { backgroundColor: entry.color }]} />

                {/* Content */}
                <View style={styles.contentCol}>
                  <View style={styles.labelRow}>
                    <Text style={styles.emoji}>{entry.emoji}</Text>
                    <Text
                      style={[styles.entryLabel, { color: entry.color }]}
                      numberOfLines={1}
                    >
                      {entry.label}
                    </Text>
                  </View>
                  {entry.sublabel ? (
                    <Text
                      style={[styles.sublabel, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {entry.sublabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  yearHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 7,
    borderBottomWidth: 1,
  },
  monthName: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  nowBadge: {
    backgroundColor: "#D4A84333",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nowBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#D4A843",
    letterSpacing: 0.5,
  },
  monthEntryCount: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingRight: 16,
    gap: 10,
  },
  dateCol: {
    width: 46,
    alignItems: "center",
    paddingLeft: 16,
  },
  dayName: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#D4A843",
    marginTop: 3,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: "stretch",
    minHeight: 38,
    marginTop: 1,
  },
  contentCol: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: {
    fontSize: 14,
    lineHeight: 18,
  },
  entryLabel: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    lineHeight: 18,
  },
  sublabel: {
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 20,
  },
});
