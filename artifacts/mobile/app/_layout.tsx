import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ZenDots_400Regular } from "@expo-google-fonts/zen-dots";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppSplashScreen } from "@/components/AppSplashScreen";
import { FontScaleProvider } from "@/contexts/FontScaleContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { runAutoBackupIfDue } from "@/utils/backup";
import { initUsnoCache } from "@/constants/spiritualData";
import { checkAndAlertTodayEvents, requestPermissions } from "@/utils/notificationScheduler";
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
    ...Feather.font,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!appReady) return;
    runAutoBackupIfDue().catch(() => {});
    initUsnoCache().catch(() => {});
    loadNotificationSettings().then((settings) => {
      // Request OS permission proactively on startup when master is enabled,
      // matching how location permission is already requested on first launch.
      if (settings.masterEnabled) {
        requestPermissions().catch(() => {});
      }
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
                <BottomSheetModalProvider>
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
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </UserProfileProvider>
          </FontScaleProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
