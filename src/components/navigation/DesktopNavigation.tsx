import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, PublicContentMaxWidth } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Feather } from '@expo/vector-icons';

import { Container } from '@/components/common/Container';

export const DesktopNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDesktop } = useResponsive();
  const { authenticatedRole, viewMode, returnToAdmin } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact public navigation items as specified
  const navItems = [
    { label: 'Buy', path: '/properties?type=buy' },
    { label: 'Rent', path: '/properties?type=rent' },
    { label: 'Commercial', path: '/properties?category=commercial' },
    { label: 'Plots & Land', path: '/properties?category=plots' },
    { label: 'Agents', path: '/agents' },
  ];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    router.push(path as any);
  };

  return (
    <View style={styles.headerSticky}>
      <Container>
        <View style={styles.headerRow}>
          {/* Left: Brand Logo */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleNav('/(tabs)')}
          style={styles.brand}
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>C</Text>
            <View style={styles.brandDot} />
          </View>
          <View>
            <Text style={styles.brandTitle}>CITYSPACE</Text>
            <Text style={styles.brandSubtitle}>PROPERTY MARKETPLACE</Text>
          </View>
        </TouchableOpacity>

        {/* Desktop Middle: Navigation Items */}
        {isDesktop && (
          <View style={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path.startsWith('/properties') && pathname.includes('properties') && item.path === pathname);
              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={() => handleNav(item.path)}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                >
                  <Text
                    style={[
                      styles.navItemText,
                      isActive && styles.navItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Desktop Right: Actions */}
        {isDesktop ? (
          <View style={styles.rightGroup}>
            {/* View as User Mode Banner Action for Admin */}
            {authenticatedRole === 'ADMIN' && viewMode === 'PUBLIC' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  returnToAdmin();
                  router.push('/admin' as any);
                }}
                style={styles.returnToAdminBtn}
              >
                <Feather
                  name="shield"
                  size={14}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.returnToAdminText}>Return to Admin</Text>
              </TouchableOpacity>
            )}

            {/* Contact Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleNav('/contact')}
              style={styles.contactBtn}
            >
              <Feather name="message-square" size={14} color={Colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>

            {/* Admin Portal Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (authenticatedRole === 'ADMIN') {
                  handleNav('/admin');
                } else {
                  handleNav('/(auth)/login');
                }
              }}
              style={styles.adminPortalBtn}
            >
              <Feather name="lock" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.adminPortalBtnText}>Admin Portal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Mobile Hamburger Button */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMobileMenuOpen(true)}
            style={styles.mobileMenuBtn}
            accessibilityLabel="Open navigation menu"
          >
            <Feather name="menu" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
        </View>
      </Container>

      {/* Clean Mobile Navigation Drawer */}
      <Modal
        visible={mobileMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMobileMenuOpen(false)}
          />
          <View style={styles.drawerCard}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.brand}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>C</Text>
                </View>
                <Text style={styles.brandTitle}>CITYSPACE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMobileMenuOpen(false)}
                style={styles.closeBtn}
              >
                <Feather name="x" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Drawer Items */}
            <ScrollView style={styles.drawerBody} contentContainerStyle={styles.drawerBodyContent}>
              <View style={styles.drawerSection}>
                <Text style={styles.drawerSectionHeading}>EXPLORE PROPERTIES</Text>
                {navItems.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => handleNav(item.path)}
                    style={styles.drawerNavItem}
                  >
                    <Text style={styles.drawerNavText}>{item.label}</Text>
                    <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.drawerDivider} />

              {/* Mobile Actions */}
              <View style={styles.drawerActions}>
                {authenticatedRole === 'ADMIN' && viewMode === 'PUBLIC' && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileMenuOpen(false);
                      returnToAdmin();
                      router.push('/admin' as any);
                    }}
                    style={[styles.drawerActionBtn, styles.drawerActionAdminReturn]}
                  >
                    <Feather name="shield" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.drawerActionAdminReturnText}>Return to Admin</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleNav('/contact')}
                  style={[styles.drawerActionBtn, styles.drawerActionContact]}
                >
                  <Feather name="message-square" size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
                  <Text style={styles.drawerActionContactText}>Contact Cityspace</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (authenticatedRole === 'ADMIN') {
                      handleNav('/admin');
                    } else {
                      handleNav('/(auth)/login');
                    }
                  }}
                  style={[styles.drawerActionBtn, styles.drawerActionPortal]}
                >
                  <Feather name="lock" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.drawerActionPortalText}>Admin Portal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSticky: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      },
    }),
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 76,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginLeft: 1.5,
    marginTop: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.8,
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#94A3B8',
    marginTop: -2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': {
          backgroundColor: '#F8FAFC',
        },
      } as any,
    }),
  },
  navItemActive: {
    backgroundColor: '#F1F5F9',
  },
  navItemText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#475569',
    letterSpacing: -0.1,
  },
  navItemTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#0F172A',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  returnToAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
    }),
  },
  returnToAdminText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': {
          backgroundColor: '#F8FAFC',
          borderColor: '#CBD5E1',
        },
      } as any,
    }),
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  adminPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': {
          backgroundColor: '#1E293B',
        },
      } as any,
    }),
  },
  adminPortalBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  mobileMenuBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  drawerCard: {
    width: 320,
    maxWidth: '85%',
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    flex: 1,
  },
  drawerBodyContent: {
    padding: 20,
  },
  drawerSection: {
    gap: 4,
  },
  drawerSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    marginBottom: 8,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  drawerNavText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  drawerActions: {
    gap: 12,
  },
  drawerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  drawerActionAdminReturn: {
    backgroundColor: '#0F172A',
  },
  drawerActionAdminReturnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  drawerActionContact: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerActionContactText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 14,
  },
  drawerActionPortal: {
    backgroundColor: '#0F172A',
  },
  drawerActionPortalText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
