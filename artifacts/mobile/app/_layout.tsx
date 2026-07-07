import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ZenDots_400Regular } from "@expo-google-fonts/zen-dots";
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
import { runAutoBackupIfDue } from "@/utils/backup";
import { checkAndAlertTodayEvents } from "@/utils/notificationScheduler";
import { loadNotificationSettings } from "@/utils/notificationSettings";

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
    ZenDots_400Regular,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!appReady) return;
    runAutoBackupIfDue().catch(() => {});
    loadNotificationSettings().then((settings) => {
      checkAndAlertTodayEvents(settings).catch(() => {});
    }).catch(() => {});
  }, [appReady]);

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
                      fontsLoaded={fontsLoaded ?? false}
                      onComplete={() => setAppReady(true)}
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
