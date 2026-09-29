import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { PropertyCategories } from '@/constants/categories';
import { PropertyCategoryType } from '@/types/property';

export interface CategoryPillsProps {
  activeCategory: PropertyCategoryType;
  onSelectCategory: (category: PropertyCategoryType) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PropertyCategories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.75}
            onPress={() => onSelectCategory(cat.id as PropertyCategoryType)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Feather
              name={(cat.icon as any) || 'home'}
              size={15}
              color={isActive ? '#FFFFFF' : Colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {cat.name}
            </Text>
            <View
              style={[styles.countBadge, isActive && styles.countBadgeActive]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  isActive && styles.countBadgeTextActive,
                ]}
              >
                {cat.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
    }),
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
});
