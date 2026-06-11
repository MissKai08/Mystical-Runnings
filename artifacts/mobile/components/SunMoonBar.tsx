import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useFontScale } from "@/contexts/FontScaleContext";
import type { SunMoonTimes } from "@/hooks/useSunMoon";

interface Props {
  times: SunMoonTimes | null;
  status: "idle" | "loading" | "denied" | "ready";
  onRetry?: () => void;
}

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const ITEMS = [
  { key: "sunrise" as const, label: "Sunrise",  emoji: "🌅" },
  { key: "sunset"  as const, label: "Sunset",   emoji: "🌇" },
  { key: "moonrise"as const, label: "Moonrise", emoji: "🌕" },
  { key: "moonset" as const, label: "Moonset",  emoji: "🌑" },
];

export function SunMoonBar({ times, status, onRetry }: Props) {
  const colors = useColors();
  const { fs } = useFontScale();
  const s = styles(colors, fs);

  if (status === "loading" || status === "idle") {
    return (
      <View style={s.card}>
        <ActivityIndicator size="small" color="#D4A843" />
      </View>
    );
  }

  if (status === "denied") {
    return (
      <Pressable style={s.card} onPress={onRetry}>
        <Text style={s.deniedText}>📍 Tap to enable location for sun & moon times</Text>
      </Pressable>
    );
  }

  return (
    <View style={s.card}>
      {times?.cityName ? (
        <Text style={s.city}>📍 {times.cityName}</Text>
      ) : null}
      <View style={s.row}>
        {ITEMS.map((item, i) => (
          <React.Fragment key={item.key}>
            <View style={s.cell}>
              <Text style={s.emoji}>{item.emoji}</Text>
              <Text style={s.time}>{fmt(times?.[item.key] ?? null)}</Text>
              <Text style={s.label}>{item.label}</Text>
            </View>
            {i < ITEMS.length - 1 && <View style={s.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styles(colors: any, fs: (n: number) => number) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#D4A84333",
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 72,
    },
    city: {
      fontSize: fs(11),
      color: colors.mutedForeground,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    cell: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    emoji: {
      fontSize: fs(18),
    },
    time: {
      fontSize: fs(13),
      fontWeight: "600",
      color: colors.foreground,
    },
    label: {
      fontSize: fs(10),
      color: colors.mutedForeground,
      letterSpacing: 0.4,
    },
    divider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
    deniedText: {
      fontSize: fs(12),
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });
}
