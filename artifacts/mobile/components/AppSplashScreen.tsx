import React, { useEffect, useState } from "react";
import { View, StyleSheet, ImageBackground, useWindowDimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

const SPLASH_IMAGE = require("../assets/images/splash.png");

interface Props {
  onComplete: () => void;
  fontsLoaded?: boolean;
}

export function AppSplashScreen({ onComplete, fontsLoaded }: Props) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => { SplashScreen.hideAsync().catch(() => {}); }, []);

  useEffect(() => {
    progress.value = withTiming(100, { duration: 5500, easing: Easing.linear });
    const doneTimer = setTimeout(() => setTimerDone(true), 5500);
    return () => clearTimeout(doneTimer);
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  const tipStyle = useAnimatedStyle(() => ({
    left: `${progress.value}%`,
    marginLeft: -4,
  }));

  useEffect(() => {
    if (timerDone && fontsLoaded) onComplete();
  }, [timerDone, fontsLoaded]);

  return (
    <ImageBackground
      source={SPLASH_IMAGE}
      style={{ position: "absolute", top: 0, left: 0, width, height, zIndex: 9999, alignItems: "center", justifyContent: "flex-end", backgroundColor: "#080714" }}
      resizeMode="contain"
    >
      <View style={[styles.progressSection, { width: width - 88 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, fillStyle]} />
          <Animated.View style={[styles.progressTip, tipStyle]} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  progressSection: { marginBottom: 72 },
  progressTrack: { width: "100%", height: 2, backgroundColor: "#7C3AED22", borderRadius: 1, overflow: "visible" },
  progressFill: { position: "absolute", left: 0, top: 0, height: 2, backgroundColor: "#D4A843", borderRadius: 1, shadowColor: "#D4A843", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 },
  progressTip: { position: "absolute", top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: "#D4A843", shadowColor: "#D4A843", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6 },
});
