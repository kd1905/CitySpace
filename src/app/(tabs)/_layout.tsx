import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/features/auth/AuthContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabsLayout() {
  const { isDesktop } = useResponsive();
  const { favoritesCount } = useFavorites();
  const { isAdmin } = useAuth();

  return (
    <View style={styles.container}>
      {/* Top Header & Navigation (Sticky desktop bar + mobile drawer) */}
      <DesktopNavigation />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: isDesktop
            ? { display: 'none' }
            : {
              backgroundColor: '#FFFFFF',
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: Platform.select({ ios: 84, default: 62 }),
              paddingTop: 8,
              paddingBottom: Platform.select({ ios: 28, default: 8 }),
            },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size || 20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Feather name="search" size={size || 20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: Colors.primary,
              fontSize: 10,
              fontWeight: '700',
              color: '#FFFFFF',
            },
            tabBarIcon: ({ color, size }) => (
              <Feather name="heart" size={size || 20} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size || 20} color={color} />
            ),
          }}
        />

        {/* Hidden internal route for add if ever triggered, strictly hidden from tab bar */}
        <Tabs.Screen
          name="add"
          options={{
            href: null, // Completely hidden from mobile tab bar for normal users!
          }}
        />

        <Tabs.Screen
          name="my-visits"
          options={{
            title: 'My Visits',
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size || 20} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
