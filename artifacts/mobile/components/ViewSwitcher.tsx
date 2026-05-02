import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

export type CalendarView = "month" | "week" | "day" | "schedule";

interface Props {
  mode: CalendarView;
  onModeChange: (mode: CalendarView) => void;
}

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
  { key: "schedule", label: "Schedule" },
];

export function ViewSwitcher({ mode, onModeChange }: Props) {
  const colors = useColors();

  const handlePress = (key: CalendarView) => {
    Haptics.selectionAsync();
    onModeChange(key);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {VIEWS.map((v) => {
        const isActive = v.key === mode;
        return (
          <Pressable
            key={v.key}
            onPress={() => handlePress(v.key)}
            style={[
              styles.tab,
              isActive && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                isActive && styles.activeLabel,
              ]}
            >
              {v.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  activeLabel: {
    fontWeight: "700",
  },
});
