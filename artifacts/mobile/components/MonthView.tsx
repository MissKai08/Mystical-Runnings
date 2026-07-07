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
  isSameDay,
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getSabbatForDate,
} from "@/constants/spiritualData";
import {
  getHolidaysForDate,
  HOLIDAY_REGION_COLOR,
  type HolidayRegion,
} from "@/constants/religiousHolidays";
import { EventDot } from "./EventDot";
import * as Haptics from "expo-haptics";
import { SpecialCalendarEntry, getSpecialEntriesForDate, SPECIAL_EVENT_COLOR } from "@/utils/specialCalendar";

interface Props {
  year: number;
  month: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  enabledRegions: Set<HolidayRegion>;
  birthdayMonth?: number;
  birthdayDay?: number;
  journaledDates?: Set<string>;
  journalMoonColors?: Record<string, string>;
  specialEntries?: SpecialCalendarEntry[];
  ifaEnabled?: boolean;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthView({ year, month, selectedDate, onSelectDate, enabledRegions, birthdayMonth, birthdayDay, journaledDates, journalMoonColors, specialEntries = [], ifaEnabled = true }: Props) {
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
            const holidays = enabledRegions.size > 0
              ? getHolidaysForDate(day).filter((h) => enabledRegions.has(h.region))
              : [];

            const isCurrentMonth = day.getMonth() === month;
            const isBirthday = !!(birthdayMonth && birthdayDay &&
              day.getMonth() + 1 === birthdayMonth &&
              day.getDate() === birthdayDay);
            const mm = String(day.getMonth() + 1).padStart(2, "0");
            const dd = String(day.getDate()).padStart(2, "0");
            const dateKey = `${day.getFullYear()}-${mm}-${dd}`;

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
                  {getSabbatForDate(day) && <View style={[styles.sabbatDot]} />}
                  {retrograde && <EventDot type="retrograde" size={4} />}
                  {prayerDay && ifaEnabled && <EventDot type="ifa-prayer" size={4} />}
                  {festival && ifaEnabled && <EventDot type="ifa-festival" size={4} />}
                  {holidays.slice(0, 2).map((h, hi) => (
                    <View
                      key={hi}
                      style={[styles.holidayDot, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] }]}
                    />
                  ))}
                  {isBirthday && (
                    <View style={[styles.holidayDot, { backgroundColor: "#D4A843" }]} />
                  )}
                  {getSpecialEntriesForDate(specialEntries, day).length > 0 && (
                    <View style={[styles.holidayDot, { backgroundColor: SPECIAL_EVENT_COLOR }]} />
                  )}
                  {journaledDates?.has(dateKey) && (
                    <View style={[
                      styles.journalDot,
                      { backgroundColor: journalMoonColors?.[dateKey] ?? "#34D399" },
                    ]} />
                  )}
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
    gap: 2,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  journalDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.9,
  },
  sabbatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#34D399",
  },
});
