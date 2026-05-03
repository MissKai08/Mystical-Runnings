import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  ClipPath,
  G,
} from "react-native-svg";
import { MoonPhaseData } from "@/constants/spiritualData";
import { useColors } from "@/hooks/useColors";

interface Props {
  moonData: MoonPhaseData;
  size?: number;
  showLabel?: boolean;
}

interface MoonGeom {
  shadowCx: number;
  shadowR: number;
}

function useMoonGeom(phaseFraction: number, R: number, cx: number): MoonGeom {
  return useMemo(() => {
    const pf = ((phaseFraction % 1) + 1) % 1;
    const ill = (1 - Math.cos(2 * Math.PI * pf)) / 2;
    const isWaxing = pf <= 0.5;
    const shadowCx = isWaxing
      ? cx - 2 * R * ill
      : cx + 2 * R * ill;
    return { shadowCx, shadowR: R };
  }, [phaseFraction, R, cx]);
}

export function MoonPhaseCircle({ moonData, size = 56, showLabel = false }: Props) {
  const colors = useColors();
  const pad = Math.max(1, size * 0.025);
  const R = (size - pad * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const { shadowCx, shadowR } = useMoonGeom(moonData.phaseFraction, R, cx);

  const pf = ((moonData.phaseFraction % 1) + 1) % 1;
  const isNewMoon = pf < 0.04 || pf > 0.96;
  const isFullMoon = pf >= 0.46 && pf <= 0.54;

  const gradId = `mpc-surf-${Math.round(size)}`;
  const rimId = `mpc-rim-${Math.round(size)}`;
  const clipId = `mpc-clip-${Math.round(size)}`;

  const s = size / 56;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradId} cx="58%" cy="38%" r="62%">
            <Stop offset="0%"   stopColor="#E6EAF0" stopOpacity="1" />
            <Stop offset="28%"  stopColor="#C4CDD8" stopOpacity="1" />
            <Stop offset="62%"  stopColor="#8E9BAA" stopOpacity="1" />
            <Stop offset="100%" stopColor="#58626E" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id={rimId} cx="50%" cy="50%" r="50%">
            <Stop offset="70%"  stopColor="#000000" stopOpacity="0.0" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.30" />
          </RadialGradient>
          <ClipPath id={clipId}>
            <Circle cx={cx} cy={cy} r={R} />
          </ClipPath>
        </Defs>

        <G clipPath={`url(#${clipId})`}>
          {/* Base surface */}
          <Circle cx={cx} cy={cy} r={R} fill={`url(#${gradId})`} />

          {/* Edge darkening */}
          <Circle cx={cx} cy={cy} r={R} fill={`url(#${rimId})`} />

          {/* Maria — scaled to size */}
          {size >= 18 && (
            <>
              <Ellipse
                cx={cx - R * 0.22} cy={cy - R * 0.12}
                rx={R * 0.30} ry={R * 0.22}
                fill="#737E8A" opacity="0.44"
              />
              <Ellipse
                cx={cx + R * 0.18} cy={cy + R * 0.14}
                rx={R * 0.20} ry={R * 0.15}
                fill="#6A7580" opacity="0.38"
              />
              <Ellipse
                cx={cx - R * 0.10} cy={cy + R * 0.40}
                rx={R * 0.15} ry={R * 0.10}
                fill="#6E7882" opacity="0.33"
              />
            </>
          )}

          {/* Craters — only if large enough */}
          {size >= 28 && (
            <>
              <Circle
                cx={cx - R * 0.28} cy={cy + R * 0.38}
                r={R * 0.10}
                fill="#5E686E" opacity="0.52"
              />
              <Circle
                cx={cx - R * 0.28 + R * 0.04} cy={cy + R * 0.38 - R * 0.04}
                r={R * 0.04}
                fill="#A4AEB4" opacity="0.40"
              />
              <Circle
                cx={cx + R * 0.42} cy={cy - R * 0.18}
                r={R * 0.08}
                fill="#60686E" opacity="0.46"
              />
              <Circle
                cx={cx + R * 0.42 + R * 0.03} cy={cy - R * 0.18 - R * 0.03}
                r={R * 0.03}
                fill="#9EA8AE" opacity="0.38"
              />
            </>
          )}
          {size >= 44 && (
            <>
              <Circle
                cx={cx - R * 0.48} cy={cy - R * 0.28}
                r={R * 0.07}
                fill="#606870" opacity="0.44"
              />
              <Circle
                cx={cx + R * 0.10} cy={cy - R * 0.52}
                r={R * 0.05}
                fill="#626A72" opacity="0.38"
              />
              <Circle
                cx={cx + R * 0.55} cy={cy + R * 0.50}
                r={R * 0.09}
                fill="#5A6268" opacity="0.40"
              />
              <Circle
                cx={cx - R * 0.15} cy={cy + R * 0.62}
                r={R * 0.06}
                fill="#5C6470" opacity="0.36"
              />
            </>
          )}

          {/* Phase shadow — the dark circle that creates the phase shape */}
          <Circle
            cx={shadowCx}
            cy={cy}
            r={shadowR}
            fill="#060A14"
            opacity={isFullMoon ? 0 : 0.96}
          />

          {/* New moon — extra dark overlay */}
          {isNewMoon && (
            <Circle cx={cx} cy={cy} r={R} fill="#060A14" opacity="0.92" />
          )}

          {/* Full moon — bright highlight at center */}
          {isFullMoon && (
            <Circle cx={cx * 0.95} cy={cy * 0.88} r={R * 0.28} fill="#FFFFFF" opacity="0.09" />
          )}
        </G>

        {/* Rim outline */}
        <Circle
          cx={cx} cy={cy} r={R}
          fill="transparent"
          stroke={isNewMoon ? "#3D4060" : "#A8B4C0"}
          strokeWidth={isNewMoon ? 1.2 : 0.6}
          strokeOpacity={isNewMoon ? 0.7 : 0.25}
        />

        {/* Full moon glow ring */}
        {isFullMoon && (
          <>
            <Circle cx={cx} cy={cy} r={R + 2 * s} fill="transparent"
              stroke="#C8D4FF" strokeWidth={1.5 * s} strokeOpacity="0.30" />
            <Circle cx={cx} cy={cy} r={R + 4 * s} fill="transparent"
              stroke="#9AA8FF" strokeWidth={0.8 * s} strokeOpacity="0.15" />
          </>
        )}
      </Svg>

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
