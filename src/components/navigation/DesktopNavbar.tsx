import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useAuth } from '@/features/auth/AuthContext';
import { MaxContentWidth } from '@/constants/layout';

export const DesktopNavbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { favoritesCount } = useFavorites();
  const { user } = useAuth();

  const navLinks = [
    { label: 'Explore', path: '/(tabs)' },
    { label: 'Search', path: '/(tabs)/search' },
    { label: 'Saved Spaces', path: '/(tabs)/favorites' },
  ];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.navInner}>
        {/* Brand Logo */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)')}
          style={styles.brand}
        >
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>C</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>CITYSPACE</Text>
            <Text style={styles.brandSub}>ARCHITECTURAL PROPERTIES</Text>
          </View>
        </TouchableOpacity>

        {/* Center Links */}
        <View style={styles.linksContainer}>
          {navLinks.map((link) => {
            const isActive =
              pathname === link.path ||
              (link.path === '/(tabs)' && pathname === '/');
            return (
              <TouchableOpacity
                key={link.label}
                activeOpacity={0.7}
                onPress={() => router.push(link.path as any)}
                style={[styles.link, isActive && styles.linkActive]}
              >
                <Text
                  style={[styles.linkText, isActive && styles.linkTextActive]}
                >
                  {link.label}
                </Text>
                {link.label === 'Saved Spaces' && favoritesCount > 0 && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>{favoritesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {/* Quick Search trigger */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/search')}
            style={styles.searchButton}
          >
            <Feather name="search" size={16} color={Colors.textSecondary} />
            <Text style={styles.searchButtonText}>Search spaces...</Text>
            <View style={styles.searchKbd}>
              <Text style={styles.searchKbdText}>⌘K</Text>
            </View>
          </TouchableOpacity>

          {/* Profile / Account */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.profileButton}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={16} color={Colors.textPrimary} />
              </View>
            )}
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName?.split(' ')[0] || 'Account'}
            </Text>
            <Feather
              name="chevron-down"
              size={14}
              color={Colors.textSecondary}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(16px)',
      } as any,
    }),
  },
  navInner: {
    width: '100%',
    paddingHorizontal: 40,
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.primary,
  },
  brandSub: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.accent,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
    }),
  },
  linkActive: {
    backgroundColor: Colors.surfaceAlt,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  linkTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  favoriteBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  favoriteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  searchButtonText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  searchKbd: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchKbdText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 90,
  },
});
