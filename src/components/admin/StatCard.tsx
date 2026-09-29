import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: keyof typeof Feather.glyphMap;
  accentColor?: string;
  trend?: {
    text: string;
    positive?: boolean;
  };
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon = 'activity',
  accentColor = Colors.primary,
  trend,
  onPress,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, onPress && styles.interactiveCard]}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}12` }]}>
          <Feather name={icon} size={16} color={accentColor} />
        </View>
      </View>

      <View style={styles.contentRow}>
        <Text style={[styles.value, { color: Colors.textPrimary }]}>{value}</Text>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.positive ? '#ECFDF5' : '#FEF2F2' },
            ]}
          >
            <Feather
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.positive ? '#059669' : '#DC2626'}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.positive ? '#059669' : '#DC2626' },
              ]}
            >
              {trend.text}
            </Text>
          </View>
        )}
      </View>

      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 180,
    flex: 1,
    ...Shadows.sm,
  },
  interactiveCard: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
      } as any,
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
  },
});
