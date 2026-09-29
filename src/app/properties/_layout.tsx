import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';

export default function PropertiesLayout() {
  const { isDesktop } = useResponsive();

  return (
    <View style={styles.container}>
      <DesktopNavigation />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
