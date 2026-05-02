import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MoonPhaseData } from "@/constants/spiritualData";
import { useColors } from "@/hooks/useColors";

interface Props {
  moonData: MoonPhaseData;
  size?: number;
  showLabel?: boolean;
}

export function MoonPhaseCircle({ moonData, size = 56, showLabel = false }: Props) {
  const colors = useColors();
  const radius = size / 2;
  const moonLight = "#E8E4FF";
  const pf = moonData.phaseFraction;

  const isNewMoon = pf < 0.03 || pf > 0.97;
  const isFullMoon = pf >= 0.47 && pf <= 0.53;

  const shadowWidth = isNewMoon
    ? size
    : isFullMoon
    ? 0
    : pf < 0.5
    ? size * (1 - pf * 2)
    : size * ((pf - 0.5) * 2);

  const shadowSide = pf < 0.5 ? "left" : "right";

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={[
          styles.moon,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: isNewMoon ? colors.card : moonLight,
            borderColor: isNewMoon ? "#3D3A7B" : "transparent",
            borderWidth: isNewMoon ? 1.5 : 0,
          },
          isFullMoon && {
            shadowColor: "#A78BFA",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: size * 0.3,
            elevation: 10,
          },
        ]}
      >
        {!isNewMoon && !isFullMoon && (
          <View
            style={[
              styles.shadow,
              {
                width: shadowWidth,
                backgroundColor: "#080714",
                [shadowSide]: 0,
              },
            ]}
          />
        )}
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.phaseName, { color: colors.foreground }]}>{moonData.name}</Text>
          <Text style={[styles.phaseDetail, { color: colors.mutedForeground }]}>
            {moonData.illumination}% illuminated
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moon: {
    overflow: "hidden",
    position: "relative",
  },
  shadow: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  labelContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  phaseName: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  phaseDetail: {
    fontSize: 12,
    marginTop: 2,
  },
});
