import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
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
  getAstroEventForDate,
  getOseDay,
  formatDateLong,
  EVENT_COLORS,
} from "@/constants/spiritualData";
import {
  getHolidaysForDate,
  HOLIDAY_REGION_COLOR,
  HOLIDAY_REGION_LABEL,
  HOLIDAY_REGION_FLAG,
} from "@/constants/religiousHolidays";
import { MoonPhaseCircle } from "./MoonPhaseCircle";
import { OseDetailModal } from "./OseDetailModal";
import { EventDetailModal, EventDetail } from "./EventDetailModal";
import type { OseGroup } from "@/constants/spiritualData";
import { SpecialCalendarEntry, getSpecialEntriesForDate, SPECIAL_EVENT_COLOR } from "@/utils/specialCalendar";

interface Props {
  date: Date;
  birthdayName?: string;
  specialEntries?: SpecialCalendarEntry[];
  ifaEnabled?: boolean;
}

export function DayView({ date, birthdayName, specialEntries = [], ifaEnabled = true }: Props) {
  const colors = useColors();
  const moon = getMoonPhaseData(date);
  const retrograde = getMercuryRetrogradeInfo(date);
  const prayerDay = isIfaPrayerDay(date);
  const festival = getIfaFestivalForDate(date);
  const sabbat = getSabbatForDate(date);
  const namedMoon = getNamedFullMoonForDate(date);
  const darkMoon = getDarkMoonForDate(date);
  const eclipse = getEclipseForDate(date);
  const astro = getAstroEventForDate(date);
  const oseDay = getOseDay(date);
  const holidays = getHolidaysForDate(date);
  const [oseModalGroup, setOseModalGroup] = useState<OseGroup | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  const moonDetail: EventDetail = namedMoon
    ? {
        title: namedMoon.name,
        category: "FULL MOON",
        color: "#A78BFA",
        description: namedMoon.description,
        guidance:
          "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
        rows: namedMoon.sign ? [{ label: "Sign", value: namedMoon.sign }] : [],
      }
    : darkMoon
    ? {
        title: "Dark Moon",
        category: "DARK MOON",
        color: "#6D28D9",
        description: darkMoon.sign
          ? `The Dark Moon rests in ${darkMoon.sign} — a liminal threshold between endings and new beginnings. The sky is void of moonlight.`
          : "A liminal threshold between endings and new beginnings. The sky is void of moonlight.",
        guidance:
          "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
        rows: darkMoon.sign ? [{ label: "Sign", value: darkMoon.sign }] : [],
      }
    : {
        title: moon.name,
        category: "LUNAR PHASE",
        color: "#A78BFA",
        description: `The moon is currently in its ${moon.name} phase, illuminated at ${moon.illumination}% on day ${Math.round(moon.phase)} of the 30-day lunar cycle.`,
        guidance:
          "Align your intentions, actions, and rest with the moon's natural rhythm. Each phase from new to full carries distinct spiritual energy.",
        rows: [
          { label: "Illumination", value: `${moon.illumination}%` },
          { label: "Day in Cycle", value: `${Math.round(moon.phase)} of 30` },
        ],
      };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.dateTitle, { color: colors.foreground }]}>
        {formatDateLong(date)}
      </Text>

      {/* Birthday */}
      {birthdayName && (
        <View style={[styles.card, { backgroundColor: "#D4A84315", borderColor: "#D4A84355" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: "#D4A843" }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>PERSONAL</Text>
          </View>
          <Text style={[styles.cardTitle, { color: "#D4A843" }]}>🥳 Happy Birthday, {birthdayName}!</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            May this solar return bring clarity, abundance, and deep spiritual alignment.
          </Text>
        </View>
      )}

      {/* Named Full Moon overrides generic moon */}
      <Pressable
        onPress={() => setSelectedEvent(moonDetail)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {namedMoon ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#A78BFA55" }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
              <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>FULL MOON</Text>
              <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
              <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
              <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
      </Pressable>

      {/* Eclipse */}
      {eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: eclipse.name,
            category: eclipse.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE",
            color: eclipse.type === "solar-eclipse" ? "#F59E0B" : "#EC4899",
            description: eclipse.description,
            guidance: eclipse.type === "solar-eclipse"
              ? "A powerful portal for bold new beginnings. Set intentions with full awareness — eclipses accelerate what is ready to emerge."
              : "Deep illumination and release. What the eclipse reveals cannot be unseen. Trust the profound process of transformation.",
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: eclipse.type === "solar-eclipse" ? "#F59E0B55" : "#EC489955", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>
              {eclipse.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE"}
            </Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
        </Pressable>
      )}

      {/* Astronomical Event */}
      {astro && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: astro.name,
            category: astro.type === "meteor-shower" ? "METEOR SHOWER" : astro.type === "planet-opposition" ? "PLANETARY" : astro.type === "planet-elongation" ? "PLANETARY" : astro.type === "solstice" ? "SOLSTICE" : "EQUINOX",
            color: EVENT_COLORS[astro.type],
            description: astro.description,
            guidance: astro.type === "meteor-shower"
              ? "Watch the sky in wonder. Meteor showers are the cosmos reminding us that we are made of starlight — the universe is alive, and it is beautiful."
              : astro.type === "planet-opposition"
              ? "Gaze upon the brilliance of the wandering star. The planet is at its closest approach to Earth, and its sacred energy is magnified."
              : astro.type === "planet-elongation"
              ? "Mercury or Venus dances at its furthest point from the Sun. These fleeting moments are windows for watching the inner planets."
              : astro.type === "solstice"
              ? "The turning of the Sun's journey. Honor the longest or shortest day — the threshold of light and shadow where the wheel shifts."
              : "Day and night stand equal in balance. A sacred time of equilibrium, perfect for reflection, rebalancing, and alignment.",
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: `${EVENT_COLORS[astro.type]}55`, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS[astro.type] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>
              {astro.type === "meteor-shower" ? "METEOR SHOWER" : astro.type === "planet-opposition" ? "PLANETARY" : astro.type === "planet-elongation" ? "PLANETARY" : astro.type === "solstice" ? "SOLSTICE" : "EQUINOX"}
            </Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{astro.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {astro.description}
          </Text>
          <View style={[styles.infoBox, { backgroundColor: `${EVENT_COLORS[astro.type]}11` }]}>
            <Text style={[styles.infoText, { color: EVENT_COLORS[astro.type] }]}>
              {astro.type === "meteor-shower"
                ? "Watch the sky in wonder. The cosmos is alive and beautiful."
                : astro.type === "planet-opposition"
                ? "Gaze upon the brilliance of the wandering star. Its sacred energy is magnified."
                : astro.type === "planet-elongation"
                ? "Mercury or Venus dances at its furthest point from the Sun."
                : astro.type === "solstice"
                ? "Honor the turning of the Sun's journey. The threshold where light and shadow shift."
                : "Day and night stand equal. A sacred time of equilibrium and alignment."}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Sabbat / Wheel of the Year */}
      {sabbat && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: sabbat.name,
            category: "WHEEL OF THE YEAR",
            color: "#34D399",
            description: sabbat.description,
            guidance: "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: "#34D39944", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.sabbat }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>WHEEL OF THE YEAR</Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
        </Pressable>
      )}

      {/* Mercury Retrograde */}
      {retrograde && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Mercury Retrograde",
            category: "PLANETARY",
            color: "#F97316",
            description: `${retrograde.label}. Mercury governs communication, technology, contracts, and travel. During retrograde, these areas can feel disrupted or delayed.`,
            guidance: "Pause major decisions and new commitments. Use this period to review, revise, and reconnect. Back up data, confirm appointments, and speak with extra care.",
            rows: [
              { label: "Active Until", value: retrograde.end.toLocaleDateString("en-US", { month: "long", day: "numeric" }) },
            ],
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: "#F9731633", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>MERCURY</Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
        </Pressable>
      )}

      {/* Ifa Prayer Day */}
      {prayerDay && ifaEnabled && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Ojo Orunmila",
            category: "IFA PRAYER",
            color: "#D4A843",
            description: "A sacred prayer day honoring Orunmila (Ifa), the Orisa of wisdom, destiny, and divination. These days recur on a sacred Ifa calendar cycle.",
            guidance: "A powerful day for prayer, divination, and deep spiritual reflection. Offer gratitude to Orunmila — kola nuts, palm oil, and cool water are traditional.",
            rows: [
              { label: "Sacred to", value: "Orunmila · Ifa" },
              { label: "Offerings", value: "Kola nuts, palm oil, cool water" },
            ],
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: "#D4A84333", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>IFA PRAYER</Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
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
        </Pressable>
      )}

      {/* Ifa Festival */}
      {festival && ifaEnabled && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: festival.name,
            category: "IFA FESTIVAL",
            color: "#22D3EE",
            description: festival.description,
            guidance: "Participate in the energy of this festival through prayer, offerings, music, and communal celebration. Connect with the Orisa honored today.",
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: "#22D3EE33", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>IFA FESTIVAL</Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{festival.name}</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            {festival.description}
          </Text>
        </Pressable>
      )}

      {/* Religious Holidays */}
      {holidays.map((h, i) => (
        <Pressable
          key={`holiday-${i}`}
          onPress={() => setSelectedEvent({
            title: h.name,
            category: HOLIDAY_REGION_LABEL[h.region],
            color: HOLIDAY_REGION_COLOR[h.region],
            description: h.description,
            guidance: h.region === "us"
              ? "Honor this day with awareness of community, history, and shared purpose."
              : h.region === "mexico"
              ? "Celebrate Mexico's living spiritual heritage — a sacred weaving of indigenous, Catholic, and ancestral traditions."
              : h.region === "india"
              ? "India's festivals are invitations to align with the divine — through color, fire, prayer, and community."
              : "Jewish sacred days are portals of memory, renewal, and covenant — a cycle of return and recommitment.",
          })}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: HOLIDAY_REGION_COLOR[h.region] + "44",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>
              {HOLIDAY_REGION_LABEL[h.region]}
            </Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {HOLIDAY_REGION_FLAG[h.region]} {h.emoji} {h.name}
          </Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]} numberOfLines={3}>
            {h.description}
          </Text>
        </Pressable>
      ))}

      {getSpecialEntriesForDate(specialEntries, date).map((entry, ei) => (
        <Pressable
          key={`sp-${ei}`}
          onPress={() => setSelectedEvent({
            title: entry.title,
            category: entry.category.toUpperCase(),
            color: SPECIAL_EVENT_COLOR,
            description: entry.note ?? `A special occasion: ${entry.title}.`,
          })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: SPECIAL_EVENT_COLOR + "44", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardDot, { backgroundColor: SPECIAL_EVENT_COLOR }]} />
            <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>{entry.category.toUpperCase()}</Text>
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for details</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>✨ {entry.title}</Text>
          {entry.note ? (
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]} numberOfLines={3}>
              {entry.note}
            </Text>
          ) : null}
        </Pressable>
      ))}

      {/* Ose Calendar — always present, the eternal 4-day Yoruba sacred week */}
      <Pressable
        onPress={() => setOseModalGroup(oseDay)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, borderColor: oseDay.color + "44", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardDot, { backgroundColor: oseDay.color }]} />
          <Text style={[styles.cardCategory, { color: colors.mutedForeground }]}>OSE CALENDAR</Text>
          <Text style={[styles.oseTapHint, { color: colors.mutedForeground }]}>Tap to expand</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{oseDay.name}</Text>
        <View style={styles.oseOrisas}>
          {oseDay.orisas.map((o, i) => (
            <View key={i} style={[styles.oseOrisa, { borderColor: oseDay.color + "55", backgroundColor: oseDay.color + "15" }]}>
              <Text style={[styles.oseOrisaText, { color: oseDay.color }]}>{o}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cardDescription, { color: colors.mutedForeground, marginTop: 8 }]} numberOfLines={2}>
          {oseDay.description}
        </Text>
        <View style={[styles.infoBox, { backgroundColor: oseDay.color + "15" }]}>
          <Text style={[styles.infoText, { color: oseDay.color }]} numberOfLines={2}>{oseDay.guidance}</Text>
        </View>
      </Pressable>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <OseDetailModal group={oseModalGroup} onClose={() => setOseModalGroup(null)} />
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
  oseTapHint: {
    fontSize: 10,
    marginLeft: "auto",
    letterSpacing: 0.2,
  },
  tapHint: {
    fontSize: 10,
    marginLeft: "auto",
    letterSpacing: 0.2,
  },
});
