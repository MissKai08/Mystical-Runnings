import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
}

export function AppSplashScreen({ onComplete }: Props) {
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
        <View style={styles.moonCircle} />
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
    fontFamily: "Arial",
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
