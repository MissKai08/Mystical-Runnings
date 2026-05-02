import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  addDays,
  getEventsForDate,
  formatDateShort,
  isSameDay,
  SpiritualEvent,
  EventType,
} from "@/constants/spiritualData";
import { EventDetailModal, EventDetail } from "./EventDetailModal";

interface Props {
  startDate: Date;
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

function buildEventDetail(event: SpiritualEvent): EventDetail {
  return {
    title: event.name,
    category: CATEGORY_LABELS[event.type] ?? event.type.toUpperCase().replace(/-/g, " "),
    color: event.color,
    description: event.description,
    guidance: GUIDANCE[event.type],
  };
}

export function ScheduleView({ startDate }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  const schedule = useMemo(() => {
    const entries: { date: Date; events: SpiritualEvent[] }[] = [];
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
      if (notable.length > 0) {
        entries.push({ date, events: notable });
      }
    }
    return entries;
  }, [startDate]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {schedule.map(({ date, events }, i) => {
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
              </View>
            </View>
          );
        })}
      </ScrollView>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
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
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
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
