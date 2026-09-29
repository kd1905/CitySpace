import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Container } from '@/components/common/Container';
import { useAuth } from '@/features/auth/AuthContext';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';

export default function AddPropertyRedirect() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  if (isAdmin) {
    router.replace('/admin/add-property');
    return null;
  }

  return (
    <View style={styles.screen}>
      <Container style={{ maxWidth: 540 }}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="shield" size={32} color={Colors.accent} />
          </View>

          <Text style={styles.title}>Admin-Curated Marketplace</Text>
          <Text style={styles.desc}>
            To preserve the highest standards of architectural verification and clear title documentation, properties on Cityspace are published and managed exclusively by accredited administrators.
          </Text>
          <Text style={styles.subDesc}>
            If you are a property owner seeking representation, please connect with our Private Advisory desk.
          </Text>

          <Button
            title="Return to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            size="lg"
            style={{ marginTop: 20 }}
          />
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
