import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Deterministic star field — no Math.random() to avoid jitter
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
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim    = useRef(new Animated.Value(0)).current;
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const titleY          = useRef(new Animated.Value(24)).current;
  const moonOpacity     = useRef(new Animated.Value(0)).current;
  const moonScale       = useRef(new Animated.Value(0.75)).current;
  const glowScale       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.18, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Main sequence
    Animated.sequence([
      // Moon rises
      Animated.parallel([
        Animated.timing(moonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(moonScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
      // Title slides up and fades in
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
      // Progress bar fills
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: false,
      }),
      // Hold at 100%
      Animated.delay(350),
      // Fade out
      Animated.timing(containerOpacity, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Star field */}
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

      {/* Radial background glow */}
      <View style={styles.bgGlow} />

      {/* Moon + glow */}
      <Animated.View
        style={[
          styles.moonWrap,
          { opacity: moonOpacity, transform: [{ scale: moonScale }] },
        ]}
      >
        <Animated.View
          style={[styles.moonGlowOuter, { transform: [{ scale: glowScale }] }]}
        />
        <View style={styles.moonGlowInner} />
        <Text style={styles.moonEmoji}>🌙</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleBlock,
          {
            opacity:   titleOpacity,
            transform: [{ translateY: titleY }],
          },
        ]}
      >
        <Text style={styles.titleLine}>MYSTICAL</Text>
        <Text style={styles.titleLine}>RUNNINGS</Text>

        {/* Decorative divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerStar}>✦</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.subtitle}>ALIGN WITH THE COSMOS</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
          {/* Glow tip */}
          <Animated.View
            style={[
              styles.progressTip,
              {
                left: progressAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
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
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7C3AED",
    opacity: 0.18,
  },
  moonGlowInner: {
    position: "absolute",
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#A78BFA",
    opacity: 0.15,
  },
  moonEmoji: {
    fontSize: 76,
    lineHeight: 84,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 52,
  },
  titleLine: {
    fontFamily: "Beasigne",
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
    marginLeft: -4,
    shadowColor: "#D4A843",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});
