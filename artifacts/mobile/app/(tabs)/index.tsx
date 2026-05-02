import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  isSameDay,
  EVENT_COLORS,
  addDays,
  formatDateShort,
} from "@/constants/spiritualData";
import { MoonPhaseCircle } from "@/components/MoonPhaseCircle";
import { NotificationSettingsModal } from "@/components/NotificationSettingsModal";
import { OseDetailModal } from "@/components/OseDetailModal";
import { EventDetailModal, EventDetail } from "@/components/EventDetailModal";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  const sabbat = useMemo(() => getSabbatForDate(today), [today]);
  const namedMoon = useMemo(() => getNamedFullMoonForDate(today), [today]);
  const darkMoon = useMemo(() => getDarkMoonForDate(today), [today]);
  const eclipse = useMemo(() => getEclipseForDate(today), [today]);
  const oseDay = useMemo(() => getOseDay(today), [today]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [oseModalGroup, setOseModalGroup] = useState<import("@/constants/spiritualData").OseGroup | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const hasAnyAlert = !!(retrograde || prayerDay || festival || sabbat || namedMoon || darkMoon || eclipse);

  const weekStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const dots: { color: string; key: string }[] = [];

      const nm = getNamedFullMoonForDate(d);
      const dm = getDarkMoonForDate(d);
      const ec = getEclipseForDate(d);
      const sb = getSabbatForDate(d);
      const rt = getMercuryRetrogradeInfo(d);
      const pr = isIfaPrayerDay(d);
      const fv = getIfaFestivalForDate(d);

      if (nm) dots.push({ color: EVENT_COLORS["named-moon"], key: "moon" });
      else if (dm) dots.push({ color: EVENT_COLORS["dark-moon"], key: "dark" });
      else if (m.isMajorPhase) dots.push({ color: EVENT_COLORS["full-moon"], key: "moon" });

      if (ec) dots.push({ color: EVENT_COLORS[ec.type], key: "eclipse" });
      if (sb) dots.push({ color: EVENT_COLORS.sabbat, key: "sabbat" });
      if (rt) dots.push({ color: EVENT_COLORS.retrograde, key: "retro" });
      if (pr) dots.push({ color: EVENT_COLORS["ifa-prayer"], key: "prayer" });
      if (fv) dots.push({ color: EVENT_COLORS["ifa-festival"], key: "festival" });

      // Build a short label for the most notable event
      let highlight = nm?.name ?? (dm ? `Dark Moon` : m.isMajorPhase ? m.name : null);
      if (!highlight && ec) highlight = ec.name;
      if (!highlight && sb) highlight = sb.name.split(" —")[0];

      return { date: d, dots, highlight };
    });
  }, [today]);

  const upcomingDays = useMemo(() => {
    const result: { date: Date; events: string[] }[] = [];
    for (let i = 1; i <= 21; i++) {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const r = getMercuryRetrogradeInfo(d);
      const p = isIfaPrayerDay(d);
      const f = getIfaFestivalForDate(d);
      const s = getSabbatForDate(d);
      const nm = getNamedFullMoonForDate(d);
      const dm = getDarkMoonForDate(d);
      const ec = getEclipseForDate(d);
      const events: string[] = [];

      if (nm) events.push(nm.name);
      else if (dm) events.push("Dark Moon — " + (dm.sign ?? ""));
      else if (m.isMajorPhase) events.push(m.name);

      if (ec) events.push(ec.name);
      if (s) events.push(s.name.split(" —")[0]);
      if (r && !getMercuryRetrogradeInfo(addDays(today, i - 1))) events.push("Mercury Retrograde begins");
      if (p) events.push("Ifa Prayer Day");
      if (f) events.push(f.name);

      if (events.length > 0) result.push({ date: d, events });
    }
    return result.slice(0, 7);
  }, [today]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>Mystical Runnings</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setNotifOpen(true); }}
          style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="bell" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <NotificationSettingsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Moon Phase Hero */}
      <View style={[styles.moonHero, { backgroundColor: colors.card, borderColor: "#A78BFA33" }]}>
        <MoonPhaseCircle moonData={moon} size={96} showLabel />
        {namedMoon && (
          <View style={[styles.namedMoonBadge, { backgroundColor: "#A78BFA22", borderColor: "#A78BFA55" }]}>
            <Text style={[styles.namedMoonText, { color: "#C4B5FD" }]}>
              {namedMoon.name} {namedMoon.sign ? `· ${namedMoon.sign}` : ""}
            </Text>
          </View>
        )}
        {darkMoon && (
          <View style={[styles.namedMoonBadge, { backgroundColor: "#4C1D9522", borderColor: "#6D28D955" }]}>
            <Text style={[styles.namedMoonText, { color: "#A78BFA" }]}>
              Dark Moon {darkMoon.sign ? `· ${darkMoon.sign}` : ""}
            </Text>
          </View>
        )}
        <View style={styles.moonHeroExtra}>
          <Text style={[styles.moonHeroLabel, { color: colors.mutedForeground }]}>Tonight's Sky</Text>
          <Text style={[styles.moonHeroSub, { color: colors.mutedForeground }]}>
            Day {Math.round(moon.phase)} of 30 in current cycle · {moon.illumination}% illuminated
          </Text>
        </View>
      </View>

      {/* This Week at a Glance */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
      <View style={[styles.weekStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {weekStrip.map(({ date, dots, highlight }, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={styles.weekDay}>
              <Text style={[styles.weekDayName, { color: isToday ? "#D4A843" : colors.mutedForeground }]}>
                {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
              </Text>
              <View style={[
                styles.weekDateCircle,
                isToday && { backgroundColor: "#D4A843" },
              ]}>
                <Text style={[
                  styles.weekDateNum,
                  { color: isToday ? "#080714" : colors.foreground },
                ]}>
                  {date.getDate()}
                </Text>
              </View>
              <View style={styles.weekDots}>
                {dots.slice(0, 3).map((dot, di) => (
                  <View
                    key={di}
                    style={[styles.weekDot, { backgroundColor: dot.color }]}
                  />
                ))}
              </View>
              {highlight && (
                <Text
                  style={[styles.weekHighlight, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {highlight}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Today's Energies */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Energies</Text>

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
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: eclipse.type === "solar-eclipse" ? "#F59E0B11" : "#EC489911",
            borderColor: eclipse.type === "solar-eclipse" ? "#F59E0B55" : "#EC489955",
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{eclipse.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{eclipse.description}</Text>
          </View>
        </Pressable>
      )}

      {sabbat && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: sabbat.name,
            category: "WHEEL OF THE YEAR",
            color: "#34D399",
            description: sabbat.description,
            guidance: "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#34D39911", borderColor: "#34D39944", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.sabbat }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{sabbat.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{sabbat.description}</Text>
          </View>
        </Pressable>
      )}

      {namedMoon && !eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: namedMoon.name,
            category: "FULL MOON",
            color: "#A78BFA",
            description: namedMoon.description,
            guidance: "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
            rows: namedMoon.sign ? [{ label: "Sign", value: namedMoon.sign }] : [],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#A78BFA11", borderColor: "#A78BFA44", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{namedMoon.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{namedMoon.description}</Text>
          </View>
        </Pressable>
      )}

      {darkMoon && !eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Dark Moon",
            category: "DARK MOON",
            color: "#6D28D9",
            description: darkMoon.sign
              ? `The Dark Moon rests in ${darkMoon.sign} — a liminal threshold between endings and new beginnings. The sky is void of moonlight.`
              : "A liminal threshold between endings and new beginnings. The sky is void of moonlight.",
            guidance: "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
            rows: darkMoon.sign ? [{ label: "Sign", value: darkMoon.sign }] : [],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#4C1D9522", borderColor: "#6D28D955", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["dark-moon"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Dark Moon — {darkMoon.sign}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              Rest, release, and turn inward. The new cycle approaches.
            </Text>
          </View>
        </Pressable>
      )}

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
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#F9731615", borderColor: "#F9731644", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Mercury Retrograde Active</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{retrograde.label}</Text>
          </View>
        </Pressable>
      )}

      {prayerDay && (
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
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#D4A84315", borderColor: "#D4A84344", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Ojo Orunmila</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>Sacred Ifa Prayer Day — offer gratitude</Text>
          </View>
        </Pressable>
      )}

      {festival && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: festival.name,
            category: "IFA FESTIVAL",
            color: "#22D3EE",
            description: festival.description,
            guidance: "Participate in the energy of this festival through prayer, offerings, music, and communal celebration. Connect with the Orisa honored today.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#22D3EE15", borderColor: "#22D3EE44", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{festival.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{festival.description}</Text>
          </View>
        </Pressable>
      )}

      {!hasAnyAlert && (
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

      {/* Ose Calendar — today's 4-day Yoruba sacred week group */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ose Calendar</Text>
      <Pressable
        onPress={() => setOseModalGroup(oseDay)}
        style={({ pressed }) => [
          styles.oseCard,
          { backgroundColor: colors.card, borderColor: oseDay.color + "44", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.oseCardHeader}>
          <View style={[styles.oseDot, { backgroundColor: oseDay.color }]} />
          <Text style={[styles.oseCardName, { color: colors.foreground }]}>{oseDay.name}</Text>
          <Text style={[styles.oseTapHint, { color: colors.mutedForeground }]}>Tap to expand</Text>
        </View>
        <View style={styles.oseChips}>
          {oseDay.orisas.map((o, i) => (
            <View key={i} style={[styles.oseChip, { borderColor: oseDay.color + "55", backgroundColor: oseDay.color + "18" }]}>
              <Text style={[styles.oseChipText, { color: oseDay.color }]}>{o}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.oseGuidance, { color: colors.mutedForeground }]} numberOfLines={2}>
          {oseDay.guidance}
        </Text>
      </Pressable>
      <OseDetailModal group={oseModalGroup} onClose={() => setOseModalGroup(null)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

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
                {events.map((e, ei) => {
                  const isSabbat = SABBATS_CHECK.some((s) => e.startsWith(s));
                  const isEclipse = e.includes("Eclipse");
                  const isMoon = e.includes("Moon");
                  const isRetro = e.includes("Retrograde");
                  const isPrayer = e.includes("Prayer");
                  const dotColor = isSabbat ? "#34D399" : isEclipse ? "#F59E0B" : isMoon ? "#A78BFA" : isRetro ? "#F97316" : isPrayer ? "#D4A843" : "#22D3EE";
                  return (
                    <View key={ei} style={styles.upcomingEventRow}>
                      <View style={[styles.upcomingDot, { backgroundColor: dotColor }]} />
                      <Text style={[styles.upcomingEventText, { color: colors.foreground }]}>{e}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const SABBATS_CHECK = ["Yule", "Imbolc", "Ostara", "Beltane", "Litha", "Lammas", "Mabon", "Samhain"];

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
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
    gap: 10,
  },
  namedMoonBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
  },
  namedMoonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  moonHeroExtra: {
    alignItems: "center",
  },
  moonHeroLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
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
  weekStrip: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 24,
    gap: 2,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekDayName: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  weekDateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDateNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  weekDots: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    alignItems: "center",
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weekHighlight: {
    fontSize: 8,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 11,
    paddingHorizontal: 1,
  },
  upcomingEvents: { flex: 1, justifyContent: "center", gap: 4 },
  upcomingEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upcomingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  oseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  oseCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  oseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  oseCardName: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  oseChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  oseChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  oseChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  oseGuidance: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  oseOfferings: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  oseTapHint: {
    fontSize: 10,
    marginLeft: "auto",
    letterSpacing: 0.2,
  },
  upcomingEventText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
