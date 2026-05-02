import React from "react";
import { View, StyleSheet } from "react-native";
import { EventType, EVENT_COLORS } from "@/constants/spiritualData";

interface Props {
  type: EventType;
  size?: number;
}

function getColor(type: EventType): string {
  if (type.includes("moon") || type.includes("quarter") || type.includes("crescent") || type.includes("gibbous")) {
    return EVENT_COLORS.moon;
  }
  if (type === "retrograde") return EVENT_COLORS.retrograde;
  if (type === "ifa-prayer") return EVENT_COLORS.ifaPrayer;
  if (type === "ifa-festival") return EVENT_COLORS.ifaFestival;
  return EVENT_COLORS.moon;
}

export function EventDot({ type, size = 5 }: Props) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: getColor(type) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    marginHorizontal: 1,
  },
});
