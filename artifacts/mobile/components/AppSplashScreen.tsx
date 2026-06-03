import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Svg, {
  Circle,
  Ellipse,
  Defs,
  RadialGradient,
  Stop,
  ClipPath,
  G,
  Rect,
} from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function RealisticMoon() {
  return (
    <Svg width={130} height={130} viewBox="0 0 130 130">
      <Defs>
        <RadialGradient id="moonSurface" cx="60%" cy="38%" r="62%">
          <Stop offset="0%"   stopColor="#E8ECF0" stopOpacity="1" />
          <Stop offset="30%"  stopColor="#CDD4DC" stopOpacity="1" />
          <Stop offset="65%"  stopColor="#A5B0BC" stopOpacity="1" />
          <Stop offset="100%" stopColor="#6A7480" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="craterShade" cx="30%" cy="30%" r="70%">
          <Stop offset="0%"   stopColor="#000000" stopOpacity="0.0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </RadialGradient>
        <ClipPath id="moonClip">
          <Circle cx="65" cy="65" r="54" />
        </ClipPath>
      </Defs>

      <G clipPath="url(#moonClip)">
        <Circle cx="65" cy="65" r="54" fill="url(#moonSurface)" />
        <Circle cx="65" cy="65" r="54" fill="url(#craterShade)" />

        <Ellipse cx="44" cy="42" rx="16" ry="12" fill="#7A8590" opacity="0.45" />
        <Ellipse cx="70" cy="52" rx="10" ry="8"  fill="#6E7880" opacity="0.38" />
        <Ellipse cx="55" cy="72" rx="8"  ry="6"  fill="#727E88" opacity="0.35" />
        <Ellipse cx="82" cy="38" rx="7"  ry="5"  fill="#788288" opacity="0.30" />
        <Ellipse cx="36" cy="68" rx="5"  ry="4"  fill="#6E7A82" opacity="0.32" />
        <Ellipse cx="90" cy="70" rx="9"  ry="6"  fill="#748088" opacity="0.28" />
        <Ellipse cx="60" cy="88" rx="6"  ry="4"  fill="#707C84" opacity="0.30" />

        <Circle cx="48" cy="56" r="5.5" fill="#606870" opacity="0.55" />
        <Circle cx="49" cy="55" r="2"   fill="#A0AAAF" opacity="0.45" />
        <Circle cx="72" cy="76" r="4"   fill="#58606A" opacity="0.50" />
        <Circle cx="73" cy="75" r="1.5" fill="#9AA4A8" opacity="0.40" />
        <Circle cx="36" cy="50" r="3"   fill="#606870" opacity="0.45" />
        <Circle cx="37" cy="49" r="1.2" fill="#9AA2A6" opacity="0.35" />
        <Circle cx="88" cy="55" r="3.5" fill="#5A6268" opacity="0.42" />
        <Circle cx="89" cy="54" r="1.4" fill="#98A0A4" opacity="0.35" />
        <Circle cx="60" cy="35" r="2.5" fill="#646C74" opacity="0.40" />
        <Circle cx="61" cy="34" r="1"   fill="#9CA4A8" opacity="0.35" />
        <Circle cx="78" cy="87" r="3"   fill="#5E6670" opacity="0.40" />
        <Circle cx="28" cy="74" r="2"   fill="#626A72" opacity="0.38" />
        <Circle cx="95" cy="44" r="2.5" fill="#606870" opacity="0.36" />
        <Circle cx="50" cy="92" r="2"   fill="#5A6268" opacity="0.35" />
        <Circle cx="82" cy="26" r="1.8" fill="#646C72" opacity="0.32" />
        <Circle cx="20" cy="58" r="1.5" fill="#606870" opacity="0.30" />

        <Circle cx="65" cy="65" r="54" fill="#1A2030" opacity="0.06" />
        <Circle cx="33" cy="65" r="54" fill="#080B14" opacity="0.91" />
        <Circle cx="65" cy="65" r="54" fill="transparent" stroke="#C8D4DC" strokeWidth="1.5" strokeOpacity="0.12" />
      </G>

      <Circle cx="65" cy="65" r="58" fill="transparent" stroke="#D4A843" strokeWidth="1.5" strokeOpacity="0.25" />
      <Circle cx="65" cy="65" r="62" fill="transparent" stroke="#D4A843" strokeWidth="0.5" strokeOpacity="0.12" />
    </Svg>
  );
}

const STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 0.08, y: 0.06, r: 1.5, o: 0.55 },
  { x: 0.92, y: 0.09, r: 1,   o: 0.4  },
  { x: 0.25, y: 0.12, r: 2,   o: 0.65 },
  { x: 0.72, y: 0.15, r: 1.5, o: 0.5  },
  { x: 0.44, y: 0.08, r: 1,   o: 0.6  },
  { x: 0.85, y: 0.22, r: 2.5, o: 0.75 },
  { x: 0.15, y: 0.28, r: 1,   o: 0.45 },
  { x: 0.60, y: 0.05, r: 1.5, o: 0.55 },
  { x: 0.35, y: 0.19, r: 1,   o: 0.7  },
  { x: 0.78, y: 0.35, r: 2,   o: 0.3  },
  { x: 0.05, y: 0.45, r: 1.5, o: 0.6  },
  { x: 0.95, y: 0.52, r: 1,   o: 0.5  },
  { x: 0.18, y: 0.62, r: 2,   o: 0.4  },
  { x: 0.88, y: 0.68, r: 1,   o: 0.65 },
  { x: 0.42, y: 0.75, r: 1.5, o: 0.3  },
  { x: 0.65, y: 0.82, r: 2,   o: 0.55 },
  { x: 0.12, y: 0.88, r: 1,   o: 0.5  },
  { x: 0.55, y: 0.92, r: 1.5, o: 0.4  },
  { x: 0.80, y: 0.78, r: 1,   o: 0.6  },
  { x: 0.30, y: 0.85, r: 2,   o: 0.35 },
  { x: 0.50, y: 0.38, r: 1,   o: 0.45 },
  { x: 0.03, y: 0.72, r: 1.5, o: 0.5  },
  { x: 0.97, y: 0.30, r: 1,   o: 0.4  },
  { x: 0.70, y: 0.55, r: 2,   o: 0.25 },
  { x: 0.22, y: 0.48, r: 1.5, o: 0.5  },
];

interface Props {
  onComplete: () => void;
  fontsLoaded?: boolean;
}

export function AppSplashScreen({ onComplete, fontsLoaded }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const doneTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      {STARS.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: s.x * SCREEN_W,
            top:  s.y * SCREEN_H,
            width:        s.r * 2,
            height:       s.r * 2,
            borderRadius: s.r,
            backgroundColor: "#FFFFFF",
            opacity: s.o,
          }}
        />
      ))}

      <View style={styles.bgGlow} />

      <View style={styles.moonWrap}>
        <View style={styles.moonGlowOuter} />
        <View style={styles.moonGlowInner} />
        <RealisticMoon />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.titleLine}>MYSTICAL</Text>
        <Text style={styles.titleLine}>RUNNINGS</Text>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerStar}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.subtitle}>ALIGN WITH THE COSMOS</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
          <View
            style={[
              styles.progressTip,
              { left: `${progress}%`, marginLeft: -4 },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#080714",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  bgGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#7C3AED",
    opacity: 0.06,
    top: "25%",
    alignSelf: "center",
  },
  moonWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  moonGlowOuter: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#7C3AED",
    opacity: 0.16,
  },
  moonGlowInner: {
    position: "absolute",
    width: 95,
    height: 95,
    borderRadius: 47.5,
    backgroundColor: "#A78BFA",
    opacity: 0.12,
  },
  moonCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#2D1B4E",
    borderWidth: 2,
    borderColor: "#D4A84340",
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 52,
  },
  titleLine: {
    fontFamily: "Orbitron_900Black",
    fontSize: 36,
    color: "#D4A843",
    letterSpacing: 3,
    lineHeight: 46,
    textAlign: "center",
    textShadowColor: "#D4A843",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
    width: 220,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#7C3AED66",
  },
  dividerStar: {
    fontSize: 10,
    color: "#7C3AED",
  },
  subtitle: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 9,
    color: "#A78BFA",
    letterSpacing: 4,
    textAlign: "center",
    textShadowColor: "#7C3AED",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  progressSection: {
    position: "absolute",
    bottom: 72,
    left: 44,
    right: 44,
  },
  progressTrack: {
    width: "100%",
    height: 2,
    backgroundColor: "#7C3AED22",
    borderRadius: 1,
    overflow: "visible",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 2,
    backgroundColor: "#D4A843",
    borderRadius: 1,
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  progressTip: {
    position: "absolute",
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4A843",
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});
