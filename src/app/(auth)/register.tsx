import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/features/auth/AuthContext';
import { UserRole } from '@/types/user';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const roles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'buyer', label: 'Buyer / Renter', desc: 'Seeking curated residential spaces' },
    { id: 'seller', label: 'Property Owner', desc: 'Listing an architectural property' },
    { id: 'agent', label: 'Broker / Agent', desc: 'Representing luxury real estate' },
  ];

  const handleRegister = async () => {
    if (!fullName || !email) {
      if (Platform.OS === 'web') {
        window.alert('Please provide your name and email.');
      }
      return;
    }
    setLoading(true);
    await register(fullName, email, role);
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>C</Text>
          </View>
          <Text style={styles.brandTitle}>CITYSPACE</Text>
        </View>

        <Text style={styles.title}>Join the Network</Text>
        <Text style={styles.subtitle}>
          Create your private membership to browse off-market architectural
          listings, track price updates, and connect with premier brokers.
        </Text>

        {/* Inputs */}
        <Input
          label="FULL NAME"
          placeholder="Alexander Wright"
          value={fullName}
          onChangeText={setFullName}
          icon="user"
          autoCapitalize="words"
        />

        <Input
          label="EMAIL ADDRESS"
          placeholder="alexander@example.com"
          value={email}
          onChangeText={setEmail}
          icon="mail"
          keyboardType="email-address"
        />

        <Input
          label="CHOOSE PASSWORD"
          placeholder="Minimum 8 characters"
          value={password}
          onChangeText={setPassword}
          icon="lock"
          secureTextEntry
        />

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>I AM JOINING AS</Text>
        <View style={styles.roleContainer}>
          {roles.map((r) => {
            const isSelected = role === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[
                  styles.roleCard,
                  isSelected && styles.roleCardSelected,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.roleHeader}>
                  <Text
                    style={[
                      styles.roleTitle,
                      isSelected && styles.roleTitleSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          onPress={() => setAgreed(!agreed)}
          style={styles.termsRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Feather name="check" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the Cityspace Terms of Curated Membership and Privacy Policy.
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <Button
          title="Create Membership"
          onPress={handleRegister}
          loading={loading}
          disabled={!agreed}
          variant="primary"
          size="lg"
          style={{ marginBottom: 20 }}
        />

        {/* Link back to login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={{ padding: 2 }}
          >
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: Colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.elevated,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  roleContainer: {
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  roleTitleSelected: {
    color: Colors.primary,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
});
