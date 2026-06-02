import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Orbitron_700Bold, Orbitron_900Black } from "@expo-google-fonts/orbitron";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppSplashScreen } from "@/components/AppSplashScreen";
import { FontScaleProvider } from "@/contexts/FontScaleContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

// Prevent the native splash screen from auto-hiding before fonts load.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Orbitron_700Bold,
    Orbitron_900Black,
    Beasigne: require("../assets/fonts/Beasigne.ttf"),
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => setAppReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Always render the custom splash screen immediately so it hides the native
  // Expo Go splash. The splash screen component itself calls hideAsync().
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FontScaleProvider>
            <UserProfileProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  {!appReady ? (
                    <AppSplashScreen
                      fontsLoaded={fontsLoaded}
                      onComplete={() => {}}
                    />
                  ) : (
                    <RootLayoutNav />
                  )}
                </KeyboardProvider>
              </GestureHandlerRootView>
            </UserProfileProvider>
          </FontScaleProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
