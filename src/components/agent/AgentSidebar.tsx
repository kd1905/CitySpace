import React, { useState } from 'react';
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
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useNotifications } from '@/features/notifications/NotificationContext';

export const AgentSidebar: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDesktop } = useResponsive();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { unreadCount: notifCount } = useNotifications();

  const navItems = [
    { label: 'Dashboard', path: '/agent', icon: 'grid' as const },
    { label: 'My Leads', path: '/agent/leads', icon: 'trending-up' as const },
    { label: 'My Properties', path: '/agent/properties', icon: 'home' as const },
    { label: 'Site Visits', path: '/agent/site-visits', icon: 'calendar' as const },
    { label: 'Follow-ups', path: '/agent/follow-ups', icon: 'clock' as const },
    { label: 'Clients', path: '/agent/clients', icon: 'users' as const },
    { label: 'Messages', path: '/agent/messages', icon: 'message-square' as const },
    { label: 'Performance', path: '/agent/performance', icon: 'bar-chart-2' as const },
    { label: 'Profile', path: '/agent/profile', icon: 'user' as const },
  ];

  const handleNav = (path: string) => {
    setMobileDrawerOpen(false);
    router.push(path as any);
  };

  const handleLogout = () => {
    logout();
    router.push('/(tabs)');
  };

  // Mobile drawer
  if (!isDesktop) {
    return (
      <View style={styles.mobileWrapper}>
        <View style={styles.mobileTopBar}>
          <TouchableOpacity
            onPress={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            style={styles.mobileMenuBtn}
          >
            <Feather name={mobileDrawerOpen ? 'x' : 'menu'} size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.mobileBrand}>
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>A</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>CITYSPACE</Text>
              <Text style={styles.agentLabel}>Agent Portal</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.exitBtn}>
            <Feather name="log-out" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {mobileDrawerOpen && (
          <View style={styles.mobileDrawer}>
            <View style={styles.drawerInner}>
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => handleNav(item.path)}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                  >
                    <Feather
                      name={item.icon}
                      size={16}
                      color={isActive ? '#0284C7' : Colors.textSecondary}
                      style={styles.navIcon}
                    />
                    <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.drawerBottom}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Feather name="log-out" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mobileContent}>{children}</View>
      </View>
    );
  }

  // Desktop permanent sidebar
  return (
    <View style={styles.desktopLayout}>
      <View style={styles.sidebar}>
        {/* Brand Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/agent' as any)}
          style={styles.brandHeader}
        >
          <View style={styles.agentBadge}>
            <Text style={styles.agentBadgeText}>A</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>CITYSPACE</Text>
            <Text style={styles.agentLabel}>Agent Portal</Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Items */}
        <View style={styles.navSection}>
          <Text style={styles.sectionHeading}>ADVISOR MENU</Text>
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path === '/agent' && (pathname === '/agent/' || pathname === '/agent/dashboard'));
            const isSiteVisits = item.path === '/agent/site-visits';
            return (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                onPress={() => handleNav(item.path)}
                style={[styles.navItem, isActive && styles.navItemActive]}
              >
                <Feather
                  name={item.icon}
                  size={16}
                  color={isActive ? '#0284C7' : Colors.textSecondary}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navItemText,
                    isActive && styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isSiteVisits && notifCount > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section: Profile & Logout */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.viewPublicBtn}
          >
            <Feather name="external-link" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.viewPublicBtnText}>View Public Site</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/agent/profile' as any)}
            style={styles.agentProfileRow}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155' }]}>
                <Feather name="user" size={16} color="#94A3B8" />
              </View>
            )}
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{user?.fullName || 'Agent Advisor'}</Text>
              <Text style={styles.agentEmail} numberOfLines={1}>
                {user?.email || 'advisor@cityspace.in'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Pane */}
      <View style={styles.mainContentPane}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        height: '100vh',
      } as any,
    }),
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 28,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  agentBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  agentBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: Colors.textPrimary,
  },
  agentLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#0284C7',
  },
  navSection: {
    flex: 1,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.textMuted,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
    }),
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    marginRight: 10,
  },
  navItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navItemTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
    gap: 12,
  },
  viewPublicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  viewPublicBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  agentProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  agentEmail: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  mainContentPane: {
    flex: 1,
    minHeight: '100%',
    ...Platform.select({
      web: {
        overflowY: 'auto',
        height: '100vh',
      } as any,
    }),
  },
  mobileWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mobileMenuBtn: {
    padding: 8,
  },
  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitBtn: {
    padding: 8,
  },
  mobileDrawer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
    ...Shadows.card,
  },
  drawerInner: {
    gap: 6,
  },
  drawerBottom: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    marginTop: 8,
  },
  mobileContent: {
    flex: 1,
  },
  navBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  navBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});
