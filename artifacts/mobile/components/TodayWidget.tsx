import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MoonPhaseCircle } from "@/components/MoonPhaseCircle";
import { OseDetailModal } from "@/components/OseDetailModal";
import { EventDetailModal, EventDetail } from "@/components/EventDetailModal";
import {
  getMoonPhaseData,
  getOseDay,
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getMercuryRetrogradeInfo,
  getSabbatForDate,
  getIfaFestivalForDate,
  getEclipseForDate,
  addDays,
  EVENT_COLORS,
  type OseGroup,
} from "@/constants/spiritualData";
import * as Haptics from "expo-haptics";

interface NextEvent {
  label: string;
  emoji: string;
  color: string;
  daysUntil: number;
  date: Date;
  detail: EventDetail;
}

function findNextEvent(today: Date): NextEvent | null {
  for (let i = 1; i <= 90; i++) {
    const d = addDays(today, i);

    const nm = getNamedFullMoonForDate(d);
    if (nm) {
      return {
        label: nm.name,
        emoji: "🌕",
        color: EVENT_COLORS["named-moon"],
        daysUntil: i,
        date: d,
        detail: {
          title: nm.name,
          category: "FULL MOON",
          color: EVENT_COLORS["named-moon"],
          description: nm.description,
          guidance:
            "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
          rows: nm.sign ? [{ label: "Sign", value: nm.sign }] : [],
        },
      };
    }

    const dm = getDarkMoonForDate(d);
    if (dm) {
      return {
        label: dm.sign ? `Dark Moon · ${dm.sign}` : "Dark Moon",
        emoji: "🌑",
        color: EVENT_COLORS["dark-moon"],
        daysUntil: i,
        date: d,
        detail: {
          title: "Dark Moon",
          category: "DARK MOON",
          color: EVENT_COLORS["dark-moon"],
          description: dm.sign
            ? `The Dark Moon rests in ${dm.sign} — a liminal threshold between endings and new beginnings.`
            : "A liminal threshold between endings and new beginnings. The sky is void of moonlight.",
          guidance:
            "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
          rows: dm.sign ? [{ label: "Sign", value: dm.sign }] : [],
        },
      };
    }

    const ec = getEclipseForDate(d);
    if (ec) {
      const isSolar = ec.type === "solar-eclipse";
      return {
        label: ec.name,
        emoji: isSolar ? "☀️" : "🌕",
        color: EVENT_COLORS[ec.type],
        daysUntil: i,
        date: d,
        detail: {
          title: ec.name,
          category: isSolar ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE",
          color: EVENT_COLORS[ec.type],
          description: ec.description,
          guidance: isSolar
            ? "A powerful portal for bold new beginnings. Eclipses accelerate what is ready to emerge."
            : "Deep illumination and release. What the eclipse reveals cannot be unseen.",
        },
      };
    }

    const sb = getSabbatForDate(d);
    if (sb) {
      return {
        label: sb.name.split(" —")[0],
        emoji: "🌿",
        color: EVENT_COLORS.sabbat,
        daysUntil: i,
        date: d,
        detail: {
          title: sb.name,
          category: "WHEEL OF THE YEAR",
          color: EVENT_COLORS.sabbat,
          description: sb.description,
          guidance:
            "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
        },
      };
    }

    const moon = getMoonPhaseData(d);
    if (moon.isMajorPhase) {
      const phaseEmojis: Record<string, string> = {
        "new-moon": "🌑",
        "first-quarter": "🌓",
        "full-moon": "🌕",
        "last-quarter": "🌗",
      };
      return {
        label: moon.name,
        emoji: phaseEmojis[moon.eventType] ?? "🌙",
        color: EVENT_COLORS["full-moon"],
        daysUntil: i,
        date: d,
        detail: {
          title: moon.name,
          category: moon.eventType.replace(/-/g, " ").toUpperCase(),
          color: EVENT_COLORS["full-moon"],
          description: `The ${moon.name} arrives, marking a key turning point in the lunar cycle.`,
          guidance:
            "Align your energy with the phase: plant intentions at new moon, act at first quarter, release at full moon, forgive at last quarter.",
        },
      };
    }
  }
  return null;
}

function daysLabel(n: number): string {
  if (n === 1) return "Tomorrow";
  if (n <= 6) return `in ${n} days`;
  if (n <= 13) return `in ${n} days`;
  return `in ${n} days`;
}

function moonDetailGuidance(eventType: string): string {
  const map: Record<string, string> = {
    "new-moon": "Plant seeds of intention. A time for new beginnings and fresh starts.",
    "waxing-crescent": "Nurture what you started. Let momentum build gently.",
    "first-quarter": "Take decisive action. Push past resistance with clarity.",
    "waxing-gibbous": "Refine and perfect. You are close to fullness.",
    "full-moon": "Release what no longer serves. Celebrate what has blossomed.",
    "waning-gibbous": "Integrate and harvest. Give thanks for what the full moon revealed.",
    "last-quarter": "Forgive and let go. Clear space before the next cycle begins.",
    "waning-crescent": "Rest and surrender. Honor the ending of this cycle.",
    "dark-moon": "Turn fully inward. The void is sacred — a space of pure potential.",
    "named-moon": "A sacred full moon peak — illuminate, release, and express gratitude.",
  };
  return map[eventType] ?? "Attune to the natural lunar rhythm.";
}

interface Props {
  today: Date;
}

export function TodayWidget({ today }: Props) {
  const colors = useColors();
  const moon = useMemo(() => getMoonPhaseData(today), [today]);
  const oseDay = useMemo(() => getOseDay(today), [today]);
  const nextEvent = useMemo(() => findNextEvent(today), [today]);

  const [oseModal, setOseModal] = useState<OseGroup | null>(null);
  const [eventModal, setEventModal] = useState<EventDetail | null>(null);

  const moonDetail: EventDetail = {
    title: moon.name,
    category: moon.eventType.replace(/-/g, " ").toUpperCase(),
    color: "#A78BFA",
    description: `The moon is ${moon.illumination}% illuminated — day ${Math.round(moon.phase)} of the current 30-day cycle.`,
    guidance: moonDetailGuidance(moon.eventType),
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#A78BFA22" }]}>
        {/* Moon Panel */}
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setEventModal(moonDetail); }}
          style={({ pressed }) => [styles.panel, { opacity: pressed ? 0.75 : 1 }]}
        >
          <MoonPhaseCircle moonData={moon} size={44} />
          <Text style={[styles.panelLabel, { color: "#A78BFA" }]}>MOON</Text>
          <Text style={[styles.panelTitle, { color: colors.foreground }]} numberOfLines={2}>
            {moon.name}
          </Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            {moon.illumination}% lit
          </Text>
        </Pressable>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Ose Panel */}
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setOseModal(oseDay); }}
          style={({ pressed }) => [styles.panel, { opacity: pressed ? 0.75 : 1 }]}
        >
          <View style={[styles.oseDot, { backgroundColor: oseDay.color }]} />
          <Text style={[styles.panelLabel, { color: oseDay.color }]}>OSE DAY</Text>
          <Text style={[styles.panelTitle, { color: colors.foreground }]} numberOfLines={2}>
            {oseDay.name.replace("Ose ", "")}
          </Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]} numberOfLines={2}>
            {oseDay.shortOrisas}
          </Text>
        </Pressable>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Next Event Panel */}
        <Pressable
          onPress={() => {
            if (!nextEvent) return;
            Haptics.selectionAsync();
            setEventModal(nextEvent.detail);
          }}
          style={({ pressed }) => [
            styles.panel,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          {nextEvent ? (
            <>
              <Text style={styles.nextEmoji}>{nextEvent.emoji}</Text>
              <Text style={[styles.panelLabel, { color: nextEvent.color }]}>NEXT</Text>
              <Text style={[styles.panelTitle, { color: colors.foreground }]} numberOfLines={2}>
                {nextEvent.label}
              </Text>
              <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
                {daysLabel(nextEvent.daysUntil)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.nextEmoji}>✦</Text>
              <Text style={[styles.panelLabel, { color: colors.mutedForeground }]}>NEXT</Text>
              <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>Nothing soon</Text>
            </>
          )}
        </Pressable>
      </View>

      <OseDetailModal group={oseModal} onClose={() => setOseModal(null)} />
      <EventDetailModal event={eventModal} onClose={() => setEventModal(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  panel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 4,
  },
  divider: {
    width: 1,
    marginVertical: 16,
  },
  oseDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 2,
  },
  nextEmoji: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: "center",
  },
  panelLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },
  panelSub: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
});
