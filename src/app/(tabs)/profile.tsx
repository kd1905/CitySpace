import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { favoritesCount } = useFavorites();

  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [currency, setCurrency] = useState('USD ($)');

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Container style={{ maxWidth: 780 }}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={32} color={Colors.primary} />
              </View>
            )}

            <View style={styles.profileInfo}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.userName}>
                  {user?.fullName || 'Guest Explorer'}
                </Text>
                {user?.verified && (
                  <Badge label="Verified Member" variant="verified" size="sm" />
                )}
              </View>

              <Text style={styles.userEmail}>
                {user?.email || 'Exploring without account'}
              </Text>

              <View style={styles.metaLocationRow}>
                <Feather name="map-pin" size={13} color={Colors.textMuted} />
                <Text style={styles.locationText}>
                  {user?.location || 'Global'} • Member since{' '}
                  {user?.memberSince || '2026'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Cards */}
          <View style={styles.metricsGrid}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/favorites')}
              style={styles.metricItem}
              activeOpacity={0.8}
            >
              <Text style={styles.metricNumber}>{favoritesCount}</Text>
              <Text style={styles.metricLabel}>Saved Spaces</Text>
            </TouchableOpacity>

            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>
                {user?.scheduledToursCount || 2}
              </Text>
              <Text style={styles.metricLabel}>Tours Booked</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>
                {user?.inquiriesCount || 6}
              </Text>
              <Text style={styles.metricLabel}>Advisory Inquiries</Text>
            </View>
          </View>
        </View>

        {/* Private Client Advisory Quick Actions */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>PRIVATE CLIENT SERVICES</Text>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Your private advisory concierge is available 24/7 at concierge@cityspace.luxury');
              }
            }}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Feather name="shield" size={16} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.menuTitle}>Discreet Portfolio Advisory</Text>
                <Text style={styles.menuSub}>
                  Access off-market private listings and off-ledger estates
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Feather name="compass" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.menuTitle}>Saved Search Alerts</Text>
                <Text style={styles.menuSub}>
                  Instant push notifications on price adjustments
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>PREFERENCES & LOCALIZATION</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Display Currency</Text>
              <Text style={styles.settingSub}>
                Selected: USD ($) • Real-time forex valuation
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const next =
                  currency === 'USD ($)'
                    ? 'EUR (€)'
                    : currency === 'EUR (€)'
                      ? 'GBP (£)'
                      : 'USD ($)';
                setCurrency(next);
              }}
              style={styles.currencyBtn}
            >
              <Text style={styles.currencyBtnText}>{currency}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Private Tour Reminders</Text>
              <Text style={styles.settingSub}>
                Calendar invites and SMS confirmations
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Cityspace Architectural Journal</Text>
              <Text style={styles.settingSub}>
                Monthly curated monographs on visionary spaces
              </Text>
            </View>
            <Switch
              value={newsletter}
              onValueChange={setNewsletter}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Support & Account */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>SUPPORT & LEGAL</Text>

          <TouchableOpacity
            style={styles.simpleRow}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Contacting Cityspace Concierge...');
              }
            }}
          >
            <Text style={styles.simpleRowText}>Private Concierge Desk</Text>
            <Feather name="arrow-up-right" size={15} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simpleRow}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Cityspace Terms of Service and Verification Protocol');
              }
            }}
          >
            <Text style={styles.simpleRowText}>Terms of Architectural Curation</Text>
            <Feather name="arrow-up-right" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Action button */}
        <View style={styles.actionContainer}>
          {isAuthenticated ? (
            <Button
              title="Sign Out of Cityspace"
              onPress={handleLogout}
              variant="outline"
              size="md"
              icon="log-out"
            />
          ) : (
            <Button
              title="Member Sign In / Register"
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
              size="md"
              icon="log-in"
            />
          )}
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 60,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
    marginBottom: 24,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 18,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  metaLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.subtle,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.accent,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  currencyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  simpleRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  actionContainer: {
    paddingVertical: 8,
  },
});
