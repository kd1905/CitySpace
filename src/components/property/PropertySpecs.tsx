import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { PropertySpecs as SpecsData } from '@/types/property';
import { formatArea } from '@/utils/formatters';

export interface PropertySpecsProps {
  specs: SpecsData;
  style?: ViewStyle;
  compact?: boolean;
}

export const PropertySpecs: React.FC<PropertySpecsProps> = ({
  specs,
  style,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {/* Bedrooms */}
      <View style={styles.specItem}>
        <Feather
          name="moon"
          size={compact ? 13 : 15}
          color={Colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.specValue, compact && styles.specValueCompact]}>
          {specs.bedrooms}
        </Text>
        <Text style={[styles.specLabel, compact && styles.specLabelCompact]}>
          {compact ? 'beds' : 'Bedrooms'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Bathrooms */}
      <View style={styles.specItem}>
        <Feather
          name="droplet"
          size={compact ? 13 : 15}
          color={Colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.specValue, compact && styles.specValueCompact]}>
          {specs.bathrooms}
        </Text>
        <Text style={[styles.specLabel, compact && styles.specLabelCompact]}>
          {compact ? 'baths' : 'Bathrooms'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Area Sq Ft */}
      <View style={styles.specItem}>
        <Feather
          name="maximize-2"
          size={compact ? 13 : 15}
          color={Colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.specValue, compact && styles.specValueCompact]}>
          {specs.areaSqFt.toLocaleString()}
        </Text>
        <Text style={[styles.specLabel, compact && styles.specLabelCompact]}>
          {compact ? 'sq ft' : 'Square Feet'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  containerCompact: {
    paddingVertical: 4,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 4,
  },
  specValueCompact: {
    fontSize: 13,
  },
  specLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  specLabelCompact: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
});
