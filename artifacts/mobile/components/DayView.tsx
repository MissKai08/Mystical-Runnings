import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  formatDateLong,
  EVENT_COLORS,
} from "@/constants/spiritualData";
import { MoonPhaseCircle } from "./MoonPhaseCircle";

interface Props {
  date: Date;
}

export function DayView({ date }: Props) {
  const colors = useColors();
  const moon = getMoonPhaseData(date);
  const retrograde = getMercuryRetrogradeInfo(date);
  const prayerDay = isIfaPrayerDay(date);
  const festival = getIfaFestivalForDate(date);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.dateTitle, { color: colors.foreground }]}>
        {formatDateLong(date)}
      </Text>

      {/* Moon Phase Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#A78BFA33" }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.moon }]} />
          <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>LUNAR</Text>
        </View>
        <View style={styles.moonContent}>
          <MoonPhaseCircle moonData={moon} size={72} showLabel={false} />
          <View style={styles.moonInfo}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{moon.name}</Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              {moon.illumination}% illuminated
            </Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Day {Math.round(moon.phase)} of 30 in cycle
            </Text>
          </View>
        </View>
      </View>

      {/* Mercury Retrograde Card */}
      {retrograde && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#F9731633" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>MERCURY</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mercury Retrograde</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {retrograde.label}
          </Text>
          <Text style={[styles.retrogradeNote, { color: "#F97316" }]}>
            Active until {retrograde.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
          <View style={[styles.warningBox, { backgroundColor: "#F9731611" }]}>
            <Text style={[styles.warningText, { color: "#F97316" }]}>
              Pause major decisions. Review, reflect, and reconnect. Communication may be disrupted.
            </Text>
          </View>
        </View>
      )}

      {/* Ifa Prayer Day Card */}
      {prayerDay && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#D4A84333" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.ifaPrayer }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>IFA PRAYER</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ojo Orunmila</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Sacred day of Orunmila, deity of wisdom and divination
          </Text>
          <View style={[styles.infoBox, { backgroundColor: "#D4A84311" }]}>
            <Text style={[styles.infoText, { color: "#D4A843" }]}>
              A powerful day for prayer, divination, and spiritual reflection. Offer gratitude to Orunmila.
            </Text>
          </View>
        </View>
      )}

      {/* Ifa Festival Card */}
      {festival && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#22D3EE33" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.ifaFestival }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>IFA FESTIVAL</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{festival.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {festival.description}
          </Text>
        </View>
      )}

      {/* Peaceful Day */}
      {!retrograde && !prayerDay && !festival && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Peaceful Day</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            No major spiritual events today. A day for stillness, gratitude, and alignment.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  moonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  moonInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  retrogradeNote: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  warningBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  infoBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
