import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ViewSwitcher, CalendarView } from "@/components/ViewSwitcher";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";
import { ScheduleView } from "@/components/ScheduleView";
import { getStartOfWeek } from "@/constants/spiritualData";
import * as Haptics from "expo-haptics";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [calView, setCalView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayDate, setDisplayDate] = useState<Date>(new Date());

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const weekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);

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
        <View style={styles.headerRow}>
          <Pressable onPress={handlePrev} style={styles.navBtn} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </Pressable>

          <Pressable onPress={handleToday} style={styles.titleWrap}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{headerTitle}</Text>
          </Pressable>

          <Pressable onPress={handleNext} style={styles.navBtn} hitSlop={8}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* View Switcher */}
      <ViewSwitcher mode={calView} onModeChange={setCalView} />

      {/* Calendar Content */}
      <View style={styles.calendarContent}>
        {calView === "month" && (
          <View style={styles.monthPad}>
            <MonthView
              year={year}
              month={month}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </View>
        )}

        {calView === "week" && (
          <WeekView
            startDate={weekStart}
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setDisplayDate(d); }}
          />
        )}

        {calView === "day" && <DayView date={selectedDate} />}

        {calView === "schedule" && <ScheduleView startDate={displayDate} />}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
        <LegendItem color="#A78BFA" label="Moon" />
        <LegendItem color="#F97316" label="Retrograde" />
        <LegendItem color="#D4A843" label="Ifa Prayer" />
        <LegendItem color="#22D3EE" label="Festival" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
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
  calendarContent: {
    flex: 1,
  },
  monthPad: {
    paddingHorizontal: 8,
    flex: 1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
