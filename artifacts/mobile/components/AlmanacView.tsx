import React, { useMemo, useRef, useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
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
import { EventDetailModal, EventDetail } from "./EventDetailModal";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CATEGORY_LABEL: Record<string, string> = {
  "new-moon": "NEW MOON",
  "dark-moon": "DARK MOON",
  "first-quarter": "FIRST QUARTER",
  "full-moon": "FULL MOON",
  "named-moon": "FULL MOON",
  "last-quarter": "LAST QUARTER",
  "solar-eclipse": "SOLAR ECLIPSE",
  "lunar-eclipse": "LUNAR ECLIPSE",
  sabbat: "WHEEL OF THE YEAR",
  retrograde: "PLANETARY",
  "ifa-festival": "IFA FESTIVAL",
  "ifa-prayer": "IFA PRAYER",
};

const GUIDANCE: Record<string, string> = {
  "new-moon":
    "Plant seeds of intention. The new moon is a time for new beginnings, fresh starts, and setting powerful intentions for the cycle ahead.",
  "dark-moon":
    "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
  "first-quarter":
    "Take decisive action on the intentions you set at the new moon. Overcome obstacles and push forward with clarity and courage.",
  "full-moon":
    "Release what no longer serves. Full moons illuminate what was hidden and call for completion, gratitude, and letting go.",
  "named-moon":
    "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
  "last-quarter":
    "Release, forgive, and let go. The waning moon calls for reflection and clearing space before the next cycle begins.",
  "solar-eclipse":
    "A powerful portal for bold new beginnings. Set intentions with full awareness — eclipses accelerate what is ready to emerge.",
  "lunar-eclipse":
    "Deep illumination and release. What the eclipse reveals cannot be unseen. Trust the profound process of transformation.",
  sabbat:
    "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
  retrograde:
    "Pause major decisions and new commitments. Review, revise, and reconnect. Back up data and speak with extra care.",
  "ifa-festival":
    "Participate in the energy of this festival through prayer, offerings, music, and communal celebration. Connect with the Orisa honored today.",
};

interface AlmanacEntry {
  date: Date;
  label: string;
  category: string;
  color: string;
  emoji: string;
  type: string;
  description: string;
  rows?: { label: string; value: string }[];
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
      category: "FULL MOON",
      color: EVENT_COLORS["named-moon"],
      emoji: "🌕",
      type: "named-moon",
      description: m.description,
      rows: m.sign ? [{ label: "Sign", value: m.sign }] : [],
      isToday: isSameDay(m.date, today),
    });
  }

  // Dark moons
  for (const m of DARK_MOONS) {
    if (m.date.getFullYear() !== year) continue;
    const phaseData = getMoonPhaseData(m.date);
    const isAlsoNewMoon = phaseData.isMajorPhase && phaseData.eventType === "new-moon";
    entries.push({
      date: m.date,
      label: isAlsoNewMoon ? "Dark Moon · New Moon" : "Dark Moon",
      category: "DARK MOON",
      color: EVENT_COLORS["dark-moon"],
      emoji: "🌑",
      type: "dark-moon",
      description: m.sign
        ? `The Dark Moon${isAlsoNewMoon ? " and New Moon coincide" : ""} in ${m.sign} — a liminal threshold between endings and new beginnings. The sky is void of moonlight.`
        : "A liminal threshold between endings and new beginnings. The sky holds no reflected moonlight.",
      rows: m.sign ? [{ label: "Sign", value: m.sign }] : [],
      isToday: isSameDay(m.date, today),
    });
  }

  // All computed major phases not covered by named/dark moon lists
  const cursor = new Date(year, 0, 1, 12, 0, 0);
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
        const descriptions: Record<string, string> = {
          "new-moon": `The New Moon opens a portal of new beginnings. The sky is dark — set intentions for the cycle ahead. Currently at ${m.illumination}% illumination.`,
          "first-quarter": `The First Quarter Moon rises to half-light, calling for decisive action. Tend the seeds planted at the new moon. Currently at ${m.illumination}% illumination.`,
          "full-moon": `The Full Moon reaches its peak, illuminating what was hidden. A time for gratitude, ritual, and release. Currently at ${m.illumination}% illumination.`,
          "last-quarter": `The Last Quarter Moon wanes toward darkness, inviting release and forgiveness. Clear space before the next cycle. Currently at ${m.illumination}% illumination.`,
        };
        entries.push({
          date: new Date(cursor),
          label: m.name,
          category: CATEGORY_LABEL[m.eventType ?? ""] ?? m.eventType?.toUpperCase() ?? "LUNAR",
          color: EVENT_COLORS[m.eventType],
          emoji,
          type: m.eventType ?? "full-moon",
          description: descriptions[m.eventType ?? ""] ?? `${m.illumination}% illuminated.`,
          rows: [{ label: "Illumination", value: `${m.illumination}%` }],
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
      category: e.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE",
      color: EVENT_COLORS[e.type],
      emoji: e.type === "solar-eclipse" ? "☀️" : "🌙",
      type: e.type,
      description: e.description,
      isToday: isSameDay(e.date, today),
    });
  }

  // Sabbats
  for (const s of SABBATS) {
    if (s.date.getFullYear() !== year) continue;
    const shortName = s.name.split(" —")[0];
    entries.push({
      date: s.date,
      label: shortName,
      category: "WHEEL OF THE YEAR",
      color: EVENT_COLORS.sabbat,
      emoji: "✦",
      type: "sabbat",
      description: s.description,
      isToday: isSameDay(s.date, today),
    });
  }

  // Mercury Retrograde — start and end
  for (const r of MERCURY_RETROGRADES) {
    if (r.start.getFullYear() === year) {
      entries.push({
        date: r.start,
        label: "Mercury Retrograde begins",
        category: "PLANETARY",
        color: EVENT_COLORS.retrograde,
        emoji: "☿",
        type: "retrograde",
        description: `${r.label}. Mercury governs communication, technology, contracts, and travel. During retrograde, these areas can feel disrupted or delayed.`,
        rows: [
          {
            label: "Active Until",
            value: r.end.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
          },
        ],
        isToday: isSameDay(r.start, today),
      });
    }
    if (r.end.getFullYear() === year) {
      entries.push({
        date: r.end,
        label: "Mercury Retrograde ends",
        category: "PLANETARY",
        color: EVENT_COLORS.retrograde,
        emoji: "☿",
        type: "retrograde-end",
        description: `${r.label}. Mercury resumes direct motion — communications, technology, and travel begin to flow more freely again.`,
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
      category: "IFA FESTIVAL",
      color: EVENT_COLORS["ifa-festival"],
      emoji: "✦",
      type: "ifa-festival",
      description: f.description,
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

function buildEventDetail(entry: AlmanacEntry): EventDetail {
  return {
    title: entry.label,
    category: entry.category,
    color: entry.color,
    description: entry.description,
    guidance: GUIDANCE[entry.type] ?? GUIDANCE[entry.type.replace("-end", "")] ?? undefined,
    rows: entry.rows,
  };
}

export function AlmanacView() {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();

  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

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
    <>
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
              <View style={styles.monthHeaderRow}>
                <View style={[styles.monthHeaderLine, { backgroundColor: colors.border }]} />
                <Text
                  style={[
                    styles.monthHeaderText,
                    { color: isCurrentMonth ? "#D4A843" : colors.mutedForeground },
                  ]}
                >
                  {MONTH_NAMES[group.month].toUpperCase()}
                </Text>
                {isCurrentMonth && (
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowBadgeText}>NOW</Text>
                  </View>
                )}
                <View style={[styles.monthHeaderLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.entryCount, { color: colors.mutedForeground }]}>
                  {group.entries.length}
                </Text>
              </View>

              {/* Event cards */}
              {group.entries.map((entry, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedEvent(buildEventDetail(entry))}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: entry.isToday
                        ? entry.color
                        : entry.color + "44",
                      borderWidth: entry.isToday ? 1.5 : 1,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  {/* Card header: dot + category + date */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardDot, { backgroundColor: entry.color }]} />
                    <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>
                      {entry.category}
                    </Text>
                    <Text style={[styles.cardDate, { color: entry.isToday ? "#D4A843" : colors.mutedForeground }]}>
                      {entry.isToday ? "Today · " : ""}
                      {DAY_NAMES[entry.date.getDay()]}{" "}
                      {entry.date.getDate()}
                    </Text>
                    <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </View>

                  {/* Title */}
                  <View style={styles.titleRow}>
                    <Text style={styles.emoji}>{entry.emoji}</Text>
                    <Text style={[styles.cardTitle, { color: entry.color }]}>
                      {entry.label}
                    </Text>
                  </View>

                  {/* Description */}
                  <Text
                    style={[styles.cardDescription, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {entry.description}
                  </Text>

                  {/* Today indicator */}
                  {entry.isToday && (
                    <View style={[styles.todayBar, { backgroundColor: entry.color + "22" }]}>
                      <Text style={[styles.todayBarText, { color: entry.color }]}>
                        ✦ This is today
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  yearHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  monthHeaderLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  monthHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
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
  entryCount: {
    fontSize: 10,
    fontWeight: "600",
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    flex: 1,
  },
  cardDate: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tapHint: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  todayBar: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  todayBarText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
