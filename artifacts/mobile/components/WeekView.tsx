import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  isSameDay,
  addDays,
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getSabbatForDate,
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getEclipseForDate,
  getAstroEventForDate,
  getOseDay,
  EVENT_COLORS,
  OseGroup,
} from "@/constants/spiritualData";
import {
  getHolidaysForDate,
  HOLIDAY_REGION_COLOR,
  HOLIDAY_REGION_LABEL,
  HOLIDAY_REGION_FLAG,
  type HolidayRegion,
} from "@/constants/religiousHolidays";
import * as Haptics from "expo-haptics";
import { EventDetailModal, EventDetail } from "./EventDetailModal";
import { OseDetailModal } from "./OseDetailModal";

import { SpecialCalendarEntry, getSpecialEntriesForDate, SPECIAL_EVENT_COLOR } from "@/utils/specialCalendar";

interface Props {
  startDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  enabledRegions: Set<HolidayRegion>;
  specialEntries?: SpecialCalendarEntry[];
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HOLIDAY_GUIDANCE: Record<HolidayRegion, string> = {
  us: "Honor this day with awareness of community, history, and shared purpose.",
  mexico: "Celebrate Mexico's living spiritual heritage — a sacred weaving of indigenous, Catholic, and ancestral traditions.",
  india: "India's festivals are invitations to align with the divine — through color, fire, prayer, and community.",
  jewish: "Jewish sacred days are portals of memory, renewal, and covenant — a cycle of return and recommitment.",
};

export function WeekView({ startDate, selectedDate, onSelectDate, enabledRegions, specialEntries = [] }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [oseModalGroup, setOseModalGroup] = useState<OseGroup | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.row}>
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const moon = getMoonPhaseData(day);
            const retrograde = getMercuryRetrogradeInfo(day);
            const prayerDay = isIfaPrayerDay(day);
            const festival = getIfaFestivalForDate(day);
            const sabbat = getSabbatForDate(day);
            const namedMoon = getNamedFullMoonForDate(day);
            const darkMoon = getDarkMoonForDate(day);
            const eclipse = getEclipseForDate(day);
            const astro = getAstroEventForDate(day);
            const oseDay = getOseDay(day);
            const holidays = getHolidaysForDate(day).filter((h) => enabledRegions.has(h.region));

            return (
              <Pressable
                key={i}
                style={styles.dayCol}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectDate(day);
                }}
              >
                <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                  {SHORT_DAYS[day.getDay()]}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    isToday && { backgroundColor: colors.primary },
                    isSelected && !isToday && { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isToday || isSelected ? "#fff" : colors.foreground },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.indicators}>
                  {(namedMoon || moon.isMajorPhase) && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
                  )}
                  {darkMoon && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS["dark-moon"] }]} />
                  )}
                  {eclipse && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
                  )}
                  {sabbat && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS.sabbat }]} />
                  )}
                  {retrograde && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS.retrograde }]} />
                  )}
                  {prayerDay && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
                  )}
                  {festival && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
                  )}
                  {astro && (
                    <View style={[styles.dot, { backgroundColor: EVENT_COLORS[astro.type] }]} />
                  )}
                  {holidays.slice(0, 2).map((h, hi) => (
                    <View key={hi} style={[styles.dot, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] }]} />
                  ))}
                  {getSpecialEntriesForDate(specialEntries, day).length > 0 && (
                    <View style={[styles.dot, { backgroundColor: SPECIAL_EVENT_COLOR }]} />
                  )}
                  <View style={[styles.dot, { backgroundColor: oseDay.color }]} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <ScrollView style={styles.detailArea} showsVerticalScrollIndicator={false}>
          {days.map((day, i) => {
            const moon = getMoonPhaseData(day);
            const retrograde = getMercuryRetrogradeInfo(day);
            const prayerDay = isIfaPrayerDay(day);
            const festival = getIfaFestivalForDate(day);
            const sabbat = getSabbatForDate(day);
            const namedMoon = getNamedFullMoonForDate(day);
            const darkMoon = getDarkMoonForDate(day);
            const eclipse = getEclipseForDate(day);
            const astro = getAstroEventForDate(day);
            const oseDay = getOseDay(day);
            const holidays = getHolidaysForDate(day).filter((h) => enabledRegions.has(h.region));
            const daySpecial = getSpecialEntriesForDate(specialEntries, day);
            const hasEvents = moon.isMajorPhase || retrograde || prayerDay || festival || sabbat || namedMoon || darkMoon || eclipse || holidays.length > 0 || daySpecial.length > 0;

            if (!hasEvents) {
              return (
                <View key={i} style={[styles.dayEvents, { borderLeftColor: colors.border }]}>
                  <Text style={[styles.dayEventsLabel, { color: colors.mutedForeground }]}>
                    {SHORT_DAYS[day.getDay()]} {day.getDate()}
                  </Text>
                  <Pressable
                    onPress={() => setOseModalGroup(oseDay)}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: `${oseDay.color}22`, opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: oseDay.color }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{oseDay.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                </View>
              );
            }

            return (
              <View key={i} style={[styles.dayEvents, { borderLeftColor: colors.border }]}>
                <Text style={[styles.dayEventsLabel, { color: colors.mutedForeground }]}>
                  {SHORT_DAYS[day.getDay()]} {day.getDate()}
                </Text>
                {namedMoon && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: namedMoon.name,
                      category: "FULL MOON",
                      color: EVENT_COLORS["named-moon"],
                      description: namedMoon.description,
                      guidance: "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
                      rows: namedMoon.sign ? [{ label: "Sign", value: namedMoon.sign }] : [],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#A78BFA22", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{namedMoon.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {darkMoon && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: "Dark Moon",
                      category: "DARK MOON",
                      color: EVENT_COLORS["dark-moon"],
                      description: darkMoon.sign
                        ? `The Dark Moon rests in ${darkMoon.sign} — a liminal threshold between endings and new beginnings.`
                        : "A liminal threshold between endings and new beginnings. The sky is void of moonlight.",
                      guidance: "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
                      rows: darkMoon.sign ? [{ label: "Sign", value: darkMoon.sign }] : [],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#4C1D9522", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS["dark-moon"] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>Dark Moon — {darkMoon.sign}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {!namedMoon && !darkMoon && moon.isMajorPhase && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: moon.name,
                      category: moon.eventType.toUpperCase().replace(/-/g, " "),
                      color: EVENT_COLORS["full-moon"],
                      description: `The moon is in its ${moon.name} phase, ${moon.illumination}% illuminated — day ${Math.round(moon.phase)} of the 30-day cycle.`,
                      guidance: moon.eventType === "new-moon"
                        ? "Plant seeds of intention. The new moon is a time for fresh starts and setting powerful intentions."
                        : moon.eventType === "full-moon"
                        ? "Release what no longer serves. Full moons illuminate what was hidden and call for completion."
                        : moon.eventType === "first-quarter"
                        ? "Take action on the intentions you set at the new moon. Overcome obstacles with courage."
                        : "Release, forgive, and let go. The waning moon calls for reflection and clearing space.",
                      rows: [
                        { label: "Illumination", value: `${moon.illumination}%` },
                        { label: "Cycle Day", value: `${Math.round(moon.phase)} of 30` },
                      ],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#A78BFA22", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS["full-moon"] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{moon.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {eclipse && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: eclipse.name,
                      category: eclipse.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE",
                      color: EVENT_COLORS[eclipse.type],
                      description: eclipse.description,
                      guidance: eclipse.type === "solar-eclipse"
                        ? "A powerful portal for bold new beginnings. Set intentions with full awareness — eclipses accelerate what is ready to emerge."
                        : "Deep illumination and release. What the eclipse reveals cannot be unseen. Trust the profound process of transformation.",
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: eclipse.type === "solar-eclipse" ? "#F59E0B22" : "#EC489922", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{eclipse.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {sabbat && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: sabbat.name,
                      category: "WHEEL OF THE YEAR",
                      color: EVENT_COLORS.sabbat,
                      description: sabbat.description,
                      guidance: "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#34D39922", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.sabbat }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{sabbat.name.split(" —")[0]}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {retrograde && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: "Mercury Retrograde",
                      category: "PLANETARY",
                      color: EVENT_COLORS.retrograde,
                      description: `${retrograde.label}. Mercury governs communication, technology, contracts, and travel. During retrograde, these areas can feel disrupted or delayed.`,
                      guidance: "Pause major decisions and new commitments. Use this period to review, revise, and reconnect. Speak and plan with extra care.",
                      rows: [
                        { label: "Active Until", value: retrograde.end.toLocaleDateString("en-US", { month: "long", day: "numeric" }) },
                      ],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#F9731622", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>Mercury Retrograde</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {prayerDay && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: "Ojo Orunmila",
                      category: "IFA PRAYER",
                      color: EVENT_COLORS["ifa-prayer"],
                      description: "A sacred prayer day honoring Orunmila (Ifa), the Orisa of wisdom, destiny, and divination.",
                      guidance: "A powerful day for prayer, divination, and deep spiritual reflection. Offer gratitude to Orunmila — kola nuts, palm oil, and cool water are traditional.",
                      rows: [
                        { label: "Sacred to", value: "Orunmila · Ifa" },
                        { label: "Offerings", value: "Kola nuts, palm oil, cool water" },
                      ],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#D4A84322", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>Ifa Prayer Day</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {festival && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: festival.name,
                      category: "IFA FESTIVAL",
                      color: EVENT_COLORS["ifa-festival"],
                      description: festival.description,
                      guidance: "Participate in the energy of this festival through prayer, offerings, music, and communal celebration.",
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: "#22D3EE22", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{festival.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {astro && (
                  <Pressable
                    onPress={() => setSelectedEvent({
                      title: astro.name,
                      category: astro.type === "meteor-shower" ? "METEOR SHOWER" : astro.type === "planet-opposition" ? "PLANETARY" : astro.type === "planet-elongation" ? "PLANETARY" : astro.type === "solstice" ? "SOLSTICE" : "EQUINOX",
                      color: EVENT_COLORS[astro.type],
                      description: astro.description,
                      guidance: astro.type === "meteor-shower"
                        ? "Watch the sky in wonder. The cosmos is alive and beautiful."
                        : astro.type === "planet-opposition"
                        ? "Gaze upon the brilliance of the wandering star. Its sacred energy is magnified."
                        : astro.type === "planet-elongation"
                        ? "Mercury or Venus dances at its furthest point from the Sun."
                        : astro.type === "solstice"
                        ? "Honor the turning of the Sun's journey. The threshold where light and shadow shift."
                        : "Day and night stand equal. A sacred time of equilibrium and alignment.",
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: `${EVENT_COLORS[astro.type]}22`, opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS[astro.type] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{astro.name}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                )}
                {holidays.map((h, hi) => (
                  <Pressable
                    key={`h-${hi}`}
                    onPress={() => setSelectedEvent({
                      title: h.name,
                      category: HOLIDAY_REGION_LABEL[h.region],
                      color: HOLIDAY_REGION_COLOR[h.region],
                      description: h.description,
                      guidance: HOLIDAY_GUIDANCE[h.region],
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] + "22", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>
                      {HOLIDAY_REGION_FLAG[h.region]} {h.emoji} {h.name}
                    </Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                ))}
                {daySpecial.map((entry, ei) => (
                  <Pressable
                    key={`sp-${ei}`}
                    onPress={() => setSelectedEvent({
                      title: entry.title,
                      category: entry.category.toUpperCase(),
                      color: SPECIAL_EVENT_COLOR,
                      description: entry.note ?? `A special occasion: ${entry.title}.`,
                    })}
                    style={({ pressed }) => [styles.eventChip, { backgroundColor: SPECIAL_EVENT_COLOR + "22", opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: SPECIAL_EVENT_COLOR }]} />
                    <Text style={[styles.chipText, { color: colors.foreground }]}>✨ {entry.title}</Text>
                    <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setOseModalGroup(oseDay)}
                  style={({ pressed }) => [styles.eventChip, { backgroundColor: `${oseDay.color}22`, opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={[styles.chipDot, { backgroundColor: oseDay.color }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{oseDay.name}</Text>
                  <Text style={[styles.chipHint, { color: colors.mutedForeground }]}>Tap</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <OseDetailModal group={oseModalGroup} onClose={() => setOseModalGroup(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  indicators: {
    flexDirection: "row",
    gap: 2,
    height: 5,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 36,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dayEvents: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
  },
  dayEventsLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  chipHint: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
