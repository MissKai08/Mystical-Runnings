import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  addDays,
  getEventsForDate,
  formatDateShort,
  isSameDay,
  SpiritualEvent,
} from "@/constants/spiritualData";

interface Props {
  startDate: Date;
}

export function ScheduleView({ startDate }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);

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
                <View
                  key={ei}
                  style={[
                    styles.eventCard,
                    { backgroundColor: colors.card, borderLeftColor: event.color },
                  ]}
                >
                  <Text style={[styles.eventName, { color: colors.foreground }]}>{event.name}</Text>
                  <Text style={[styles.eventDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {event.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
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
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  eventDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
