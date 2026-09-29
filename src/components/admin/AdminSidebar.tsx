import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { activityService, AdminNotification } from '@/services/activityService';
import { useNotifications } from '@/features/notifications/NotificationContext';

export const AdminSidebar: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, viewAsUser, logout } = useAuth();
  const { isDesktop } = useResponsive();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { unreadCount: visitUnreadCount, notifications: visitNotifs } = useNotifications();

  // Count pending visit requests specifically
  const pendingVisitCount = visitNotifs.filter(
    (n) => n.type === 'visit_request' && !n.isRead
  ).length;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: 'grid' as const },
    { label: 'Properties', path: '/admin/properties', icon: 'home' as const },
    { label: 'Add Property', path: '/admin/add-property', icon: 'plus-circle' as const },
    { label: 'Verification', path: '/admin/verification', icon: 'shield' as const },
    { label: 'CRM & Leads', path: '/admin/enquiries', icon: 'trending-up' as const },
    { label: 'Site Visits', path: '/admin/site-visits', icon: 'calendar' as const },
    { label: 'Agents', path: '/admin/agents', icon: 'user-check' as const },
    { label: 'Users', path: '/admin/users', icon: 'users' as const },
    { label: 'Admin Profile', path: '/admin/profile', icon: 'user' as const },
    { label: 'Analytics', path: '/admin/analytics', icon: 'bar-chart-2' as const },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' as const },
  ];

  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await activityService.getNotifications(false);
      setNotifications(list);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    }
  };

  const handleGlobalSearch = () => {
    if (!globalSearch.trim()) return;
    const q = encodeURIComponent(globalSearch.trim());
    setGlobalSearch('');
    router.push(`/admin/properties?search=${q}` as any);
  };

  const handleMarkAllRead = async () => {
    await activityService.markAllNotificationsRead();
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNav = (path: string) => {
    setMobileDrawerOpen(false);
    router.push(path as any);
  };

  const handleSwitchToUserMode = () => {
    setMobileDrawerOpen(false);
    viewAsUser();
    router.push('/(tabs)');
  };

  const handleLogout = () => {
    setMobileDrawerOpen(false);
    logout();
    router.push('/(tabs)');
  };

  // Mobile / Tablet Navigation Header & Slide Drawer
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
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>C</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>CITYSPACE</Text>
              <Text style={styles.adminLabel}>Admin</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.exitBtn}>
            <Feather name="log-out" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {mobileDrawerOpen && (
          <View style={styles.mobileDrawer}>
            <ScrollViewNav
              navItems={navItems}
              pathname={pathname}
              onSelect={handleNav}
              user={user}
              onLogout={handleLogout}
              onSwitchUserMode={handleSwitchToUserMode}
            />
          </View>
        )}

        <View style={styles.mobileContent}>{children}</View>
      </View>
    );
  }

  // Desktop Permanent Sidebar Layout
  return (
    <View style={styles.desktopLayout}>
      <View style={styles.sidebar}>
        {/* Brand Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/admin' as any)}
          style={styles.brandHeader}
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>C</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>CITYSPACE</Text>
            <Text style={styles.adminLabel}>Admin</Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Items */}
        <View style={styles.navSection}>
          <Text style={styles.sectionHeading}>MENU</Text>
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path === '/admin' && pathname === '/admin/');
            const isSiteVisits = item.path === '/admin/site-visits';
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
                  color={isActive ? Colors.primary : Colors.textSecondary}
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
                {isSiteVisits && pendingVisitCount > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{pendingVisitCount > 9 ? '9+' : pendingVisitCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section: Switch to User Mode, Profile & Logout */}
        <View style={styles.bottomSection}>
          {/* Switch User Mode button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSwitchToUserMode}
            style={styles.switchUserModeBtn}
          >
            <View style={styles.switchUserModeIconBox}>
              <Feather name="eye" size={14} color="#0284C7" />
            </View>
            <View style={styles.switchUserModeInfo}>
              <Text style={styles.switchUserModeTitle}>View as User</Text>
              <Text style={styles.switchUserModeSub}>Preview public site</Text>
            </View>
            <Feather name="chevron-right" size={13} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/admin/profile' as any)}
            style={styles.adminProfileRow}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155' }]}>
                <Feather name="user" size={16} color="#94A3B8" />
              </View>
            )}
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
              <Text style={styles.adminEmail} numberOfLines={1}>
                {user?.email || 'admin@cityspace.in'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Pane with Top Admin Header Bar */}
      <View style={styles.mainContentPane}>
        {/* Top Navbar Header with Logo on the Right Corner */}
        <View style={styles.topAdminNavbar}>
          <View style={styles.topNavbarLeft}>
            <Text style={styles.topNavbarBreadcrumb}>Cityspace Management Console</Text>
            <Text style={styles.topNavbarPath}>
              {pathname === '/admin' || pathname === '/admin/'
                ? 'Dashboard'
                : pathname.replace('/admin/', '').replace(/-/g, ' ').toUpperCase()}
            </Text>
          </View>

          <View style={styles.topNavbarRight}>
            {/* Global Search */}
            <View style={styles.searchBarContainer}>
              <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                value={globalSearch}
                onChangeText={setGlobalSearch}
                onSubmitEditing={handleGlobalSearch}
                placeholder="Search properties, leads, clients..."
                placeholderTextColor="#94A3B8"
                style={styles.searchBarInput}
                returnKeyType="search"
              />
              {globalSearch.length > 0 && (
                <TouchableOpacity onPress={() => setGlobalSearch('')}>
                  <Feather name="x" size={12} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Notification Bell */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowNotifs(!showNotifs)}
                style={styles.notifBellBtn}
              >
                <Feather name="bell" size={16} color="#475569" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Notification Popover Dropdown */}
              {showNotifs && (
                <View style={styles.notifDropdown}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifHeaderTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                      <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={styles.notifMarkAllText}>Mark all read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.notifList}>
                    {notifications.length === 0 ? (
                      <Text style={styles.notifEmptyText}>No notifications yet</Text>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <View key={n.id} style={[styles.notifItem, !n.isRead && styles.notifItemUnread]}>
                          <View style={styles.notifItemDot} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.notifItemTitle}>{n.title}</Text>
                            <Text style={styles.notifItemMsg} numberOfLines={2}>{n.message}</Text>
                            <Text style={styles.notifItemTime}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/admin/profile' as any)}
              style={[styles.headerViewAsUserBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
            >
              <Feather name="user" size={13} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text style={[styles.headerViewAsUserText, { color: '#4338CA' }]}>Admin Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSwitchToUserMode}
              style={styles.headerViewAsUserBtn}
            >
              <Feather name="eye" size={13} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.headerViewAsUserText}>View as User</Text>
            </TouchableOpacity>

            {/* Right Corner Admin Logo */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/admin' as any)}
              style={styles.rightCornerLogo}
            >
              <View style={styles.rightCornerLogoBox}>
                <Text style={styles.rightCornerLogoC}>C</Text>
                <View style={styles.rightCornerLogoDot} />
              </View>
              <View style={styles.rightCornerLogoTextCol}>
                <Text style={styles.rightCornerLogoTitle}>CITYSPACE</Text>
                <View style={styles.rightCornerAdminBadge}>
                  <Feather name="shield" size={8.5} color="#92400E" style={{ marginRight: 3 }} />
                  <Text style={styles.rightCornerAdminBadgeText}>ADMIN</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Content Area */}
        <View style={styles.pageContentWrapper}>{children}</View>
      </View>
    </View>
  );
};

// Sub-component for drawer links
const ScrollViewNav: React.FC<{
  navItems: any[];
  pathname: string;
  onSelect: (path: string) => void;
  user: any;
  onLogout: () => void;
  onSwitchUserMode: () => void;
}> = ({ navItems, pathname, onSelect, user, onLogout, onSwitchUserMode }) => (
  <View style={styles.drawerInner}>
    {navItems.map((item) => {
      const isActive = pathname === item.path;
      return (
        <TouchableOpacity
          key={item.label}
          onPress={() => onSelect(item.path)}
          style={[styles.navItem, isActive && styles.navItemActive]}
        >
          <Feather
            name={item.icon}
            size={16}
            color={isActive ? Colors.primary : Colors.textSecondary}
            style={styles.navIcon}
          />
          <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}

    {/* Switch to User Mode inside mobile drawer */}
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSwitchUserMode}
      style={styles.switchUserModeBtn}
    >
      <View style={styles.switchUserModeIconBox}>
        <Feather name="eye" size={14} color="#0284C7" />
      </View>
      <View style={styles.switchUserModeInfo}>
        <Text style={styles.switchUserModeTitle}>View as User</Text>
        <Text style={styles.switchUserModeSub}>Preview public site</Text>
      </View>
      <Feather name="chevron-right" size={13} color="#94A3B8" />
    </TouchableOpacity>

    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect('/admin/profile')}
      style={[styles.adminProfileRow, { marginHorizontal: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }]}
    >
      <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155' }]}>
        <Feather name="user" size={16} color="#94A3B8" />
      </View>
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
        <Text style={styles.adminEmail} numberOfLines={1}>
          {user?.email || 'admin@cityspace.in'}
        </Text>
      </View>
    </TouchableOpacity>

    <View style={styles.drawerBottom}>
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Feather name="log-out" size={14} color="#EF4444" style={{ marginRight: 6 }} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    width: '100%',
    ...Platform.select({
      web: {
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      } as any,
    }),
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
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: Colors.primary,
  },
  adminLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#B45309',
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
    backgroundColor: Colors.surfaceAlt,
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
    color: Colors.primary,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
    gap: 12,
  },
  switchUserModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
    }),
  },
  switchUserModeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  switchUserModeInfo: {
    flex: 1,
  },
  switchUserModeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  switchUserModeSub: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 1,
  },
  adminProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  adminEmail: {
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
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#F8FAFC',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      } as any,
    }),
  },
  topAdminNavbar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  topNavbarLeft: {
    justifyContent: 'center',
  },
  topNavbarBreadcrumb: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topNavbarPath: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  topNavbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 260,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBarInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
    padding: 0,
  } as any,
  notifBellBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  notifDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
    zIndex: 999,
    padding: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  notifHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifMarkAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  notifList: {
    gap: 8,
  },
  notifEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 6,
    borderRadius: 6,
  },
  notifItemUnread: {
    backgroundColor: '#F8FAFC',
  },
  notifItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 5,
  },
  notifItemTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  notifItemMsg: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  notifItemTime: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerViewAsUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  headerViewAsUserText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  rightCornerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  rightCornerLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rightCornerLogoC: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  rightCornerLogoDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginLeft: 1,
    marginTop: 4,
  },
  rightCornerLogoTextCol: {
    justifyContent: 'center',
  },
  rightCornerLogoTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0F172A',
  },
  rightCornerAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
    alignSelf: 'flex-start',
  },
  rightCornerAdminBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  pageContentWrapper: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        overflowY: 'auto',
        height: 'calc(100vh - 64px)',
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
