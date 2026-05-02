import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  getMonthGrid,
  getEventsForDate,
  isSameDay,
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
} from "@/constants/spiritualData";
import { EventDot } from "./EventDot";
import * as Haptics from "expo-haptics";

interface Props {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthView({ year, month, selectedDate, onSelectDate }: Props) {
  const colors = useColors();
  const today = useMemo(() => new Date(), []);
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const handleDayPress = (date: Date) => {
    Haptics.selectionAsync();
    onSelectDate(date);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false}>
      <View style={[styles.dayHeaderRow]}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={styles.dayHeaderCell}>
            <Text style={[styles.dayHeaderText, { color: colors.mutedForeground }]}>{d}</Text>
          </View>
        ))}
      </View>
      {grid.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={styles.dayCell} />;
            }
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const moon = getMoonPhaseData(day);
            const retrograde = getMercuryRetrogradeInfo(day);
            const prayerDay = isIfaPrayerDay(day);
            const festival = getIfaFestivalForDate(day);

            const isCurrentMonth = day.getMonth() === month;

            return (
              <Pressable
                key={di}
                style={[styles.dayCell]}
                onPress={() => handleDayPress(day)}
              >
                <View
                  style={[
                    styles.dayNumber,
                    isToday && { backgroundColor: colors.primary },
                    isSelected && !isToday && { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isToday || isSelected ? "#fff" : isCurrentMonth ? colors.foreground : colors.mutedForeground },
                      isToday && { color: colors.primaryForeground },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {moon.isMajorPhase && <EventDot type={moon.eventType} size={4} />}
                  {retrograde && <EventDot type="retrograde" size={4} />}
                  {prayerDay && <EventDot type="ifa-prayer" size={4} />}
                  {festival && <EventDot type="ifa-festival" size={4} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dayHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
    minHeight: 52,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dotsRow: {
    flexDirection: "row",
    marginTop: 2,
    height: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
