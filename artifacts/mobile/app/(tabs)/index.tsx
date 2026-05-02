import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  EVENT_COLORS,
  addDays,
  formatDateShort,
} from "@/constants/spiritualData";
import { MoonPhaseCircle } from "@/components/MoonPhaseCircle";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const moon = useMemo(() => getMoonPhaseData(today), [today]);
  const retrograde = useMemo(() => getMercuryRetrogradeInfo(today), [today]);
  const prayerDay = useMemo(() => isIfaPrayerDay(today), [today]);
  const festival = useMemo(() => getIfaFestivalForDate(today), [today]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const upcomingDays = useMemo(() => {
    const result: { date: Date; events: string[] }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const r = getMercuryRetrogradeInfo(d);
      const p = isIfaPrayerDay(d);
      const f = getIfaFestivalForDate(d);
      const events: string[] = [];
      if (m.isMajorPhase) events.push(m.name);
      if (r && !getMercuryRetrogradeInfo(addDays(today, i - 1))) events.push("Mercury Retrograde begins");
      if (p) events.push("Ifa Prayer Day");
      if (f) events.push(f.name);
      if (events.length > 0) result.push({ date: d, events });
    }
    return result.slice(0, 5);
  }, [today]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>Mystical Runnings</Text>
        </View>
      </View>

      {/* Moon Phase Hero */}
      <View style={[styles.moonHero, { backgroundColor: colors.card, borderColor: "#A78BFA33" }]}>
        <MoonPhaseCircle moonData={moon} size={96} showLabel />
        <View style={styles.moonHeroExtra}>
          <Text style={[styles.moonHeroLabel, { color: colors.mutedForeground }]}>Tonight's Sky</Text>
          <Text style={[styles.moonHeroSub, { color: colors.mutedForeground }]}>
            Day {Math.round(moon.phase)} of {Math.round(30)} in current cycle
          </Text>
        </View>
      </View>

      {/* Today's Alerts */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Energies</Text>

      {retrograde && (
        <View style={[styles.alertCard, { backgroundColor: "#F9731615", borderColor: "#F9731644" }]}>
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Mercury Retrograde Active</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{retrograde.label}</Text>
          </View>
        </View>
      )}

      {prayerDay && (
        <View style={[styles.alertCard, { backgroundColor: "#D4A84315", borderColor: "#D4A84344" }]}>
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.ifaPrayer }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Ojo Orunmila</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>Sacred Ifa Prayer Day — offer gratitude</Text>
          </View>
        </View>
      )}

      {festival && (
        <View style={[styles.alertCard, { backgroundColor: "#22D3EE15", borderColor: "#22D3EE44" }]}>
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.ifaFestival }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{festival.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{festival.description}</Text>
          </View>
        </View>
      )}

      {!retrograde && !prayerDay && !festival && (
        <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.alertDot, { backgroundColor: colors.mutedForeground }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Clear Channels</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              No major events today. A day of flow and alignment.
            </Text>
          </View>
        </View>
      )}

      {/* Upcoming */}
      {upcomingDays.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Coming Up</Text>
          {upcomingDays.map(({ date, events }, i) => (
            <View key={i} style={[styles.upcomingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.upcomingDate}>
                <Text style={[styles.upcomingDay, { color: colors.mutedForeground }]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </Text>
                <Text style={[styles.upcomingNum, { color: colors.foreground }]}>{date.getDate()}</Text>
              </View>
              <View style={styles.upcomingEvents}>
                {events.map((e, ei) => (
                  <Text key={ei} style={[styles.upcomingEventText, { color: colors.foreground }]}>
                    {e}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  moonHero: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    gap: 12,
  },
  moonHeroExtra: {
    alignItems: "center",
  },
  moonHeroLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  moonHeroSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  alertText: { flex: 1 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  upcomingDate: {
    width: 40,
    alignItems: "center",
  },
  upcomingDay: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  upcomingNum: {
    fontSize: 20,
    fontWeight: "700",
  },
  upcomingEvents: { flex: 1, justifyContent: "center", gap: 2 },
  upcomingEventText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
