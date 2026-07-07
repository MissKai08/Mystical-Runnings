import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";

const SPLASH_IMAGE = require("../assets/images/splash.png");

interface Props {
  onComplete: () => void;
  fontsLoaded?: boolean;
}

export function AppSplashScreen({ onComplete, fontsLoaded }: Props) {
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState(0);
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const doneTimer = setTimeout(() => {
      setTimerDone(true);
    }, 5500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    if (timerDone && fontsLoaded) {
      onComplete();
    }
  }, [timerDone, fontsLoaded]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Image
        source={SPLASH_IMAGE}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={[styles.progressSection, { width: width - 88 }]}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]}
          />
          <View
            style={[styles.progressTip, { left: `${progress}%` as `${number}%`, marginLeft: -4 }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  progressSection: {
    marginBottom: 72,
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
