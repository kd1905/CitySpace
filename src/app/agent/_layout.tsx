import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { AgentSidebar } from '@/components/agent/AgentSidebar';

export default function AgentLayout() {
  const router = useRouter();
  const { authenticatedRole, switchRole } = useAuth();

  // Role Gate: Must be an authenticated Agent
  if (authenticatedRole !== 'AGENT') {
    return (
      <View style={styles.gateScreen}>
        <View style={styles.gateCard}>
          <View style={styles.gateIconBox}>
            <Feather name="shield" size={32} color="#0284C7" />
          </View>

          <Text style={styles.gateTitle}>Cityspace Agent Portal</Text>
          <Text style={styles.gateSubtitle}>
            Authentication is required to access assigned listings, confidential buyer leads, and advisor tools.
          </Text>

          <View style={styles.roleInfoBadge}>
            <Text style={styles.roleInfoText}>
              Current Profile:{' '}
              <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
                {authenticatedRole}
              </Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login' as any)}
              style={styles.agentLoginBtn}
            >
              <Feather name="log-in" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.agentLoginBtnText}>Sign In with Agent Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)')}
              style={styles.publicBtn}
            >
              <Feather name="arrow-left" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.publicBtnText}>Return to Public Cityspace</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <AgentSidebar>
      <Slot />
    </AgentSidebar>
  );
}

const styles = StyleSheet.create({
  gateScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  gateCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 36,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    textAlign: 'center',
    ...Shadows.elevated,
  },
  gateIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  gateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  roleInfoBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    marginBottom: 24,
  },
  roleInfoText: {
    fontSize: 12,
    color: '#64748B',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  agentLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  agentLoginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  publicBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
