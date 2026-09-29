import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '@/features/favorites/FavoritesContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { NotificationProvider } from '@/features/notifications/NotificationContext';
import { AdminModeBanner } from '@/components/navigation/AdminModeBanner';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
        #root {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <FavoritesProvider>
            <StatusBar style="dark" />
            <AdminModeBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FAFAFC' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="properties" options={{ headerShown: false }} />
              <Stack.Screen name="sell" options={{ headerShown: false }} />
              <Stack.Screen name="contact" options={{ headerShown: false }} />
              <Stack.Screen name="agents" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="agent" options={{ headerShown: false }} />
            </Stack>
          </FavoritesProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
