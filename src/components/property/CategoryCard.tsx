import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius } from '@/constants/layout';
import { PropertyCategory } from '@/constants/categories';

// Category images matching reference design
const CATEGORY_IMAGES: Record<string, string> = {
  apartments: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
  houses: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
  villas: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
  plots: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
  land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
  offices: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  shops: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
  commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
};

export interface CategoryCardProps {
  category: PropertyCategory;
  count?: number;
  onPress: () => void;
  selected?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  count,
  onPress,
  selected = false,
}) => {
  const img = CATEGORY_IMAGES[category.id] || CATEGORY_IMAGES['apartments'];
  const displayCount = count !== undefined && count > 0 ? `${count} spaces` : category.count;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {/* Property Image */}
      <View style={styles.imageBox}>
        <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        <View style={[styles.imageOverlay, selected && styles.imageOverlaySelected]} />
      </View>

      {/* Bottom info */}
      <View style={styles.info}>
        <View style={styles.textGroup}>
          <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>
            {category.name}
          </Text>
          {displayCount ? (
            <Text style={[styles.count, selected && styles.countSelected]}>
              {displayCount}
            </Text>
          ) : null}
        </View>
        <View style={[styles.arrowBtn, selected && styles.arrowBtnSelected]}>
          <Feather name="arrow-right" size={14} color={selected ? '#FFFFFF' : '#0F172A'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        },
      } as any,
    }),
  },
  cardSelected: {
    borderColor: '#0F172A',
    borderWidth: 2,
  },
  imageBox: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  imageOverlaySelected: {
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  titleSelected: {
    color: '#0F172A',
  },
  count: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  countSelected: {
    color: '#475569',
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  arrowBtnSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
});
