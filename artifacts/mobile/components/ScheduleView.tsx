import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  addDays,
  getEventsForDate,
  isSameDay,
  SpiritualEvent,
  EventType,
  getOseDay,
  OseGroup,
  EVENT_COLORS,
} from "@/constants/spiritualData";
import {
  getHolidaysForDate,
  HOLIDAY_REGION_COLOR,
  HOLIDAY_REGION_LABEL,
  HOLIDAY_REGION_FLAG,
  type HolidayRegion,
  type ReligiousHoliday,
} from "@/constants/religiousHolidays";
import { EventDetailModal, EventDetail } from "./EventDetailModal";
import { OseDetailModal } from "./OseDetailModal";

interface Props {
  startDate: Date;
  enabledRegions: Set<HolidayRegion>;
}

const CATEGORY_LABELS: Partial<Record<EventType, string>> = {
  "new-moon": "NEW MOON",
  "waxing-crescent": "WAXING CRESCENT",
  "first-quarter": "FIRST QUARTER",
  "waxing-gibbous": "WAXING GIBBOUS",
  "full-moon": "FULL MOON",
  "waning-gibbous": "WANING GIBBOUS",
  "last-quarter": "LAST QUARTER",
  "waning-crescent": "WANING CRESCENT",
  "dark-moon": "DARK MOON",
  "named-moon": "FULL MOON",
  retrograde: "PLANETARY",
  "ifa-prayer": "IFA PRAYER",
  "ifa-festival": "IFA FESTIVAL",
  sabbat: "WHEEL OF THE YEAR",
  "solar-eclipse": "SOLAR ECLIPSE",
  "lunar-eclipse": "LUNAR ECLIPSE",
  "ose-day": "OSE CALENDAR",
};

const GUIDANCE: Partial<Record<EventType, string>> = {
  "new-moon":
    "Plant seeds of intention. The new moon is a time for new beginnings, fresh starts, and setting powerful intentions for the cycle ahead.",
  "first-quarter":
    "Take action on the intentions you set at the new moon. Overcome obstacles and push forward with clarity and courage.",
  "full-moon":
    "Release what no longer serves. Full moons illuminate what was hidden and call for completion, gratitude, and letting go.",
  "named-moon":
    "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
  "last-quarter":
    "Release, forgive, and let go. The waning moon calls for reflection and clearing space before the next cycle begins.",
  "dark-moon":
    "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
  retrograde:
    "Pause major decisions and new commitments. Use this period to review, revise, and reconnect. Back up data and speak with extra care.",
  "ifa-prayer":
    "A powerful day for prayer, divination, and deep spiritual reflection. Offer gratitude to Orunmila — kola nuts, palm oil, and cool water are traditional.",
  "ifa-festival":
    "Participate in the energy of this festival through prayer, offerings, music, and communal celebration. Connect with the Orisa honored today.",
  sabbat:
    "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
  "solar-eclipse":
    "A powerful portal for bold new beginnings. Set intentions with full awareness — eclipses accelerate what is ready to emerge.",
  "lunar-eclipse":
    "Deep illumination and release. What the eclipse reveals cannot be unseen. Trust the profound process of transformation.",
};

const HOLIDAY_GUIDANCE: Record<HolidayRegion, string> = {
  us: "Honor this day with awareness of community, history, and shared purpose.",
  mexico: "Celebrate Mexico's living spiritual heritage — a sacred weaving of indigenous, Catholic, and ancestral traditions.",
  india: "India's festivals are invitations to align with the divine — through color, fire, prayer, and community.",
  jewish: "Jewish sacred days are portals of memory, renewal, and covenant — a cycle of return and recommitment.",
};

function buildEventDetail(event: SpiritualEvent): EventDetail {
  return {
    title: event.name,
    category: CATEGORY_LABELS[event.type] ?? event.type.toUpperCase().replace(/-/g, " "),
    color: event.color,
    description: event.description,
    guidance: GUIDANCE[event.type],
  };
}

function buildHolidayDetail(h: ReligiousHoliday): EventDetail {
  return {
    title: h.name,
    category: HOLIDAY_REGION_LABEL[h.region],
    color: HOLIDAY_REGION_COLOR[h.region],
    description: h.description,
    guidance: HOLIDAY_GUIDANCE[h.region],
  };
}

export function ScheduleView({ startDate, enabledRegions }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [oseModalGroup, setOseModalGroup] = useState<OseGroup | null>(null);

  const schedule = useMemo(() => {
    const entries: {
      date: Date;
      events: SpiritualEvent[];
      holidays: ReligiousHoliday[];
      oseDay: OseGroup;
    }[] = [];
    for (let i = 0; i < 60; i++) {
      const date = addDays(startDate, i);
      const events = getEventsForDate(date);
      const notable = events.filter(
        (e) =>
          e.type !== "waxing-crescent" &&
          e.type !== "waning-crescent" &&
          e.type !== "waxing-gibbous" &&
          e.type !== "waning-gibbous"
      );
      const holidays = getHolidaysForDate(date).filter((h) => enabledRegions.has(h.region));
      if (notable.length > 0 || holidays.length > 0) {
        entries.push({ date, events: notable, holidays, oseDay: getOseDay(date) });
      }
    }
    return entries;
  }, [startDate, enabledRegions]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {schedule.map(({ date, events, holidays, oseDay }, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={styles.entry}>
              <View style={styles.dateCol}>
                <Text style={[styles.dateLabel, { color: isToday ? colors.primary : colors.mutedForeground }]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    isToday && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.dateNumber, { color: isToday ? colors.primaryForeground : colors.foreground }]}>
                    {date.getDate()}
                  </Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </Text>
              </View>
              <View style={styles.eventsCol}>
                {events.map((event, ei) => (
                  <Pressable
                    key={ei}
                    onPress={() => setSelectedEvent(buildEventDetail(event))}
                    style={({ pressed }) => [
                      styles.eventCard,
                      { backgroundColor: colors.card, borderLeftColor: event.color, opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <View style={styles.eventCardHeader}>
                      <Text style={[styles.eventName, { color: colors.foreground }]}>{event.name}</Text>
                      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap</Text>
                    </View>
                    <Text style={[styles.eventDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {event.description}
                    </Text>
                  </Pressable>
                ))}

                {holidays.map((h, hi) => (
                  <Pressable
                    key={`h-${hi}`}
                    onPress={() => setSelectedEvent(buildHolidayDetail(h))}
                    style={({ pressed }) => [
                      styles.eventCard,
                      styles.holidayCard,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: HOLIDAY_REGION_COLOR[h.region],
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View style={styles.eventCardHeader}>
                      <Text style={[styles.holidayRegionLabel, { color: HOLIDAY_REGION_COLOR[h.region] }]}>
                        {HOLIDAY_REGION_FLAG[h.region]} {HOLIDAY_REGION_LABEL[h.region]}
                      </Text>
                      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap</Text>
                    </View>
                    <Text style={[styles.eventName, { color: colors.foreground }]}>
                      {h.emoji} {h.name}
                    </Text>
                    <Text style={[styles.eventDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {h.description}
                    </Text>
                  </Pressable>
                ))}

                {/* Ose Calendar entry */}
                <Pressable
                  onPress={() => setOseModalGroup(oseDay)}
                  style={({ pressed }) => [
                    styles.eventCard,
                    styles.oseCard,
                    { backgroundColor: colors.card, borderLeftColor: oseDay.color, opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={[styles.oseDot, { backgroundColor: oseDay.color }]} />
                    <Text style={[styles.eventName, { color: colors.foreground }]}>{oseDay.name}</Text>
                    <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap</Text>
                  </View>
                  <Text style={[styles.eventDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {oseDay.guidance}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <OseDetailModal group={oseModalGroup} onClose={() => setOseModalGroup(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  entry: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  dateCol: {
    width: 44,
    alignItems: "center",
    paddingTop: 4,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  monthLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  eventsCol: {
    flex: 1,
    gap: 6,
  },
  eventCard: {
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  oseCard: {
    borderStyle: "dashed",
  },
  holidayCard: {
    borderStyle: "solid",
  },
  oseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  holidayRegionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tapHint: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  eventDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
