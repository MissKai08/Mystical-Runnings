import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getSabbatForDate,
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getEclipseForDate,
  getOseDay,
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
  const sabbat = getSabbatForDate(date);
  const namedMoon = getNamedFullMoonForDate(date);
  const darkMoon = getDarkMoonForDate(date);
  const eclipse = getEclipseForDate(date);
  const oseDay = getOseDay(date);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.dateTitle, { color: colors.foreground }]}>
        {formatDateLong(date)}
      </Text>

      {/* Named Full Moon overrides generic moon */}
      {namedMoon ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#A78BFA55" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>FULL MOON</Text>
          </View>
          <View style={styles.moonContent}>
            <MoonPhaseCircle moonData={moon} size={72} showLabel={false} />
            <View style={styles.moonInfo}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{namedMoon.name}</Text>
              <Text style={[styles.cardDescription, { color: "#A78BFA" }]}>
                {namedMoon.sign ? `in ${namedMoon.sign}` : ""}
              </Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                {namedMoon.description}
              </Text>
            </View>
          </View>
        </View>
      ) : darkMoon ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#6D28D944" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["dark-moon"] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>DARK MOON</Text>
          </View>
          <View style={styles.moonContent}>
            <MoonPhaseCircle moonData={moon} size={72} showLabel={false} />
            <View style={styles.moonInfo}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Dark Moon</Text>
              <Text style={[styles.cardDescription, { color: "#A78BFA" }]}>
                {darkMoon.sign ? `in ${darkMoon.sign}` : ""}
              </Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                A time for deep rest, shadow work, and release before the new cycle begins.
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#A78BFA33" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["full-moon"] }]} />
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
      )}

      {/* Eclipse */}
      {eclipse && (
        <View style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: eclipse.type === "solar-eclipse" ? "#F59E0B55" : "#EC489955" },
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>
              {eclipse.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE"}
            </Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{eclipse.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {eclipse.description}
          </Text>
          <View style={[
            styles.infoBox,
            { backgroundColor: eclipse.type === "solar-eclipse" ? "#F59E0B11" : "#EC489911" },
          ]}>
            <Text style={[styles.infoText, { color: eclipse.type === "solar-eclipse" ? "#F59E0B" : "#EC4899" }]}>
              {eclipse.type === "solar-eclipse"
                ? "A powerful portal for bold new beginnings. Set intentions with full awareness."
                : "Deep illumination and release. What the eclipse reveals cannot be unseen — trust the process."}
            </Text>
          </View>
        </View>
      )}

      {/* Sabbat / Wheel of the Year */}
      {sabbat && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#34D39944" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.sabbat }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>WHEEL OF THE YEAR</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{sabbat.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {sabbat.description}
          </Text>
          <View style={[styles.infoBox, { backgroundColor: "#34D39911" }]}>
            <Text style={[styles.infoText, { color: "#34D399" }]}>
              Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's energy.
            </Text>
          </View>
        </View>
      )}

      {/* Mercury Retrograde */}
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

      {/* Ifa Prayer Day */}
      {prayerDay && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#D4A84333" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
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

      {/* Ifa Festival */}
      {festival && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#22D3EE33" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>IFA FESTIVAL</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{festival.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {festival.description}
          </Text>
        </View>
      )}

      {/* Ose Calendar — always present, the eternal 4-day Yoruba sacred week */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: oseDay.color + "44" }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardDot, { backgroundColor: oseDay.color }]} />
          <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>OSE CALENDAR</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{oseDay.name}</Text>
        <View style={styles.oseOrisas}>
          {oseDay.orisas.map((o, i) => (
            <View key={i} style={[styles.oseOrisa, { borderColor: oseDay.color + "55", backgroundColor: oseDay.color + "15" }]}>
              <Text style={[styles.oseOrisaText, { color: oseDay.color }]}>{o}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cardDescription, { color: colors.mutedForeground, marginTop: 8 }]}>
          {oseDay.description}
        </Text>
        <View style={[styles.infoBox, { backgroundColor: oseDay.color + "15" }]}>
          <Text style={[styles.infoText, { color: oseDay.color }]}>{oseDay.guidance}</Text>
        </View>
        <Text style={[styles.oseOfferings, { color: colors.mutedForeground }]}>
          Offerings: {oseDay.offerings}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
  oseOrisas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  oseOrisa: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  oseOrisaText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  oseOfferings: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 16,
  },
});
