import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { PropertyAmenity } from '@/types/property';

export interface AmenitiesListProps {
  amenities: PropertyAmenity[];
  style?: ViewStyle;
  columns?: number;
}

export const AmenitiesList: React.FC<AmenitiesListProps> = ({
  amenities,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {amenities.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.iconCircle}>
            <Feather
              name={(item.icon as any) || 'check'}
              size={16}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.name}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
