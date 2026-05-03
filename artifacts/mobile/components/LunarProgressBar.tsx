import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { MoonPhaseData } from "@/constants/spiritualData";

const LUNAR_CYCLE = 29.530589;

const MILESTONES: { day: number; emoji: string; label: string }[] = [
  { day: 0,     emoji: "🌑", label: "New" },
  { day: 7.38,  emoji: "🌓", label: "1Q" },
  { day: 14.77, emoji: "🌕", label: "Full" },
  { day: 22.15, emoji: "🌗", label: "3Q" },
];

interface Props {
  moonData: MoonPhaseData;
}

export function LunarProgressBar({ moonData }: Props) {
  const colors = useColors();
  const progress = Math.max(0, Math.min(moonData.phase / LUNAR_CYCLE, 1));
  const pct = `${(progress * 100).toFixed(1)}%` as `${number}%`;

  return (
    <View style={styles.wrapper}>
      {/* Emoji row above the track */}
      <View style={styles.emojiRow}>
        {MILESTONES.map((m, i) => {
          const leftPct = `${((m.day / LUNAR_CYCLE) * 100).toFixed(1)}%` as `${number}%`;
          return (
            <View key={i} style={[styles.emojiPin, { left: leftPct }]}>
              <Text style={styles.emojiText}>{m.emoji}</Text>
              <Text style={[styles.emojiLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Track */}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        {/* Fill */}
        <View style={[styles.fill, { width: pct }]} />

        {/* Quarter ticks */}
        {MILESTONES.slice(1).map((m, i) => {
          const leftPct = `${((m.day / LUNAR_CYCLE) * 100).toFixed(1)}%` as `${number}%`;
          return (
            <View
              key={i}
              style={[
                styles.tick,
                { left: leftPct, backgroundColor: colors.background },
              ]}
            />
          );
        })}

        {/* Current day cursor */}
        <View style={[styles.cursor, { left: pct }]} />
      </View>

      {/* Bottom day counter */}
      <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
        Day {Math.round(moonData.phase)} of {Math.round(LUNAR_CYCLE)} · {moonData.illumination}% illuminated
      </Text>
    </View>
  );
}

const TRACK_H = 6;
const CURSOR_SIZE = 14;
const TICK_W = 2;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  emojiRow: {
    position: "relative",
    height: 36,
    width: "100%",
    marginBottom: 4,
  },
  emojiPin: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -10 }],
  },
  emojiText: {
    fontSize: 14,
    lineHeight: 18,
  },
  emojiLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  track: {
    width: "100%",
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    position: "relative",
    overflow: "visible",
  },
  fill: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: "#A78BFA",
  },
  tick: {
    position: "absolute",
    width: TICK_W,
    height: TRACK_H,
    top: 0,
    marginLeft: -TICK_W / 2,
  },
  cursor: {
    position: "absolute",
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: "#D4A843",
    top: -(CURSOR_SIZE - TRACK_H) / 2,
    marginLeft: -CURSOR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#080714",
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  dayLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
});
