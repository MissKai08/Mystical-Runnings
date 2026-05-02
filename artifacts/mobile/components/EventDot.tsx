import React from "react";
import { View, StyleSheet } from "react-native";
import { EventType, EVENT_COLORS } from "@/constants/spiritualData";

interface Props {
  type: EventType;
  size?: number;
}

function getColor(type: EventType): string {
  return EVENT_COLORS[type] ?? EVENT_COLORS["full-moon"];
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
