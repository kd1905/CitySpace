import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';

export const ActionCards: React.FC = () => {
  const router = useRouter();

  const actions = [
    {
      id: 'buy',
      title: 'BUY',
      subtitle: 'Find your dream home or plot',
      icon: 'home',
      path: '/properties?type=buy',
    },
    {
      id: 'rent',
      title: 'RENT',
      subtitle: 'Explore curated rental spaces',
      icon: 'key',
      path: '/properties?type=rent',
    },
    {
      id: 'sell',
      title: 'SELL',
      subtitle: 'Sell with Cityspace advisors',
      icon: 'trending-up',
      path: '/sell',
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((act) => (
        <TouchableOpacity
          key={act.id}
          activeOpacity={0.85}
          onPress={() => router.push(act.path as any)}
          style={styles.card}
        >
          <View style={styles.iconCircle}>
            <Feather name={act.icon as any} size={18} color={Colors.primary} />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{act.title}</Text>
              <Feather
                name="arrow-up-right"
                size={14}
                color={Colors.textMuted}
                style={styles.arrow}
              />
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              {act.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        ':hover': {
          transform: 'translateY(-2px)',
          borderColor: Colors.primary,
        },
      } as any,
    }),
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textPrimary,
  },
  arrow: {
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
