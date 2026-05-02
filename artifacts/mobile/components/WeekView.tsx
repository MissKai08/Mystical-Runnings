import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  isSameDay,
  addDays,
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  EVENT_COLORS,
} from "@/constants/spiritualData";
import * as Haptics from "expo-haptics";

interface Props {
  startDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({ startDate, selectedDate, onSelectDate }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const moon = getMoonPhaseData(day);
          const retrograde = getMercuryRetrogradeInfo(day);
          const prayerDay = isIfaPrayerDay(day);
          const festival = getIfaFestivalForDate(day);

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
                {moon.isMajorPhase && (
                  <View style={[styles.dot, { backgroundColor: EVENT_COLORS.moon }]} />
                )}
                {retrograde && (
                  <View style={[styles.dot, { backgroundColor: EVENT_COLORS.retrograde }]} />
                )}
                {prayerDay && (
                  <View style={[styles.dot, { backgroundColor: EVENT_COLORS.ifaPrayer }]} />
                )}
                {festival && (
                  <View style={[styles.dot, { backgroundColor: EVENT_COLORS.ifaFestival }]} />
                )}
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
          const hasEvents = moon.isMajorPhase || retrograde || prayerDay || festival;
          if (!hasEvents) return null;

          return (
            <View key={i} style={[styles.dayEvents, { borderLeftColor: colors.border }]}>
              <Text style={[styles.dayEventsLabel, { color: colors.mutedForeground }]}>
                {SHORT_DAYS[day.getDay()]} {day.getDate()}
              </Text>
              {moon.isMajorPhase && (
                <View style={[styles.eventChip, { backgroundColor: "#A78BFA22" }]}>
                  <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.moon }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{moon.name}</Text>
                </View>
              )}
              {retrograde && (
                <View style={[styles.eventChip, { backgroundColor: "#F9731622" }]}>
                  <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>Mercury Retrograde</Text>
                </View>
              )}
              {prayerDay && (
                <View style={[styles.eventChip, { backgroundColor: "#D4A84322" }]}>
                  <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.ifaPrayer }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>Ifa Prayer Day</Text>
                </View>
              )}
              {festival && (
                <View style={[styles.eventChip, { backgroundColor: "#22D3EE22" }]}>
                  <View style={[styles.chipDot, { backgroundColor: EVENT_COLORS.ifaFestival }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{festival.name}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
