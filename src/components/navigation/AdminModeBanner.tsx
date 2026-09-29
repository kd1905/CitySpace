import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BorderRadius } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';

export const AdminModeBanner: React.FC = () => {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { authenticatedRole, viewMode, returnToAdmin } = useAuth();

  // STRICT ACCESS RULE:
  // Show ONLY when authenticatedRole === 'ADMIN' AND viewMode === 'PUBLIC'
  // NEVER show to PUBLIC visitors
  // NEVER show to AGENT users
  // On Desktop, the header itself displays [ Return to Admin ], so hide banner to avoid duplication
  if (authenticatedRole !== 'ADMIN' || viewMode !== 'PUBLIC') {
    return null;
  }

  // On desktop, the [ Return to Admin ] button is cleanly integrated in the header
  if (isDesktop) {
    return null;
  }

  const handleReturn = () => {
    returnToAdmin();
    router.push('/admin' as any);
  };

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.leftGroup}>
          <Feather name="eye" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={styles.message}>Admin Previewing User View</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleReturn}
          style={styles.returnBtn}
        >
          <Feather name="arrow-left" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.returnBtnText}>Return to Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      } as any,
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
