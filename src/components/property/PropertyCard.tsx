import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows, Typography } from '@/constants/layout';
import { Property } from '@/types/property';
import { formatCurrency, formatArea } from '@/utils/formatters';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { getPropertyMapUrl, openExternalMap } from '@/utils/mapUtils';

export interface PropertyCardProps {
  property: Property;
  style?: ViewStyle;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  style,
}) => {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(property.id);

  const handlePress = () => {
    router.push(`/properties/${property.id}` as any);
  };

  const handleToggleFavorite = (e: any) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    toggleFavorite(property.id);
  };

  const handleOpenMap = (e: any) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    const locWithCoords = {
      ...property.location,
      name: property.placeName || property.location?.name || property.location?.neighborhood,
      placeName: property.placeName || property.location?.placeName,
      googlePlaceId: property.googlePlaceId || property.location?.googlePlaceId,
      coordinates:
        property.location?.coordinates ||
        (property.latitude && property.longitude
          ? { lat: property.latitude, lng: property.longitude }
          : undefined),
    };
    const url = getPropertyMapUrl(locWithCoords, property.title);
    openExternalMap(url);
  };

  const formattedPrice = formatCurrency(
    property.price,
    property.currency,
    property.type
  );

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.card, style]}
    >
      {/* 55–60% Visual Height Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Dark subtle gradient overlay at top for badge legibility */}
        <View style={styles.imageScrim} />

        {/* Top Badges & Favorite Button */}
        <View style={styles.topRow}>
          <View style={styles.badgesGroup}>
            {/* Status: For Sale / For Rent */}
            <View style={styles.intentBadge}>
              <Text style={styles.intentBadgeText}>
                {property.type === 'buy' ? 'For Sale' : 'For Rent'}
              </Text>
            </View>

            {/* Featured Badge */}
            {property.featured && (
              <View style={styles.featuredBadge}>
                <Feather name="star" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.featuredBadgeText}>Featured</Text>
              </View>
            )}

            {/* Verified Badge */}
            {property.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleFavorite}
            style={[styles.heartBtn, favorited && styles.heartBtnActive]}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={18}
              color={favorited ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Internal Content Spacing */}
      <View style={styles.content}>
        {/* Category Label */}
        <Text style={styles.categoryLabel}>
          {(property.categoryLabel || property.category || 'RESIDENTIAL').toUpperCase()}
        </Text>

        {/* Property Title (16-18px) */}
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        {/* Price (18-22px Prominent) */}
        <Text style={styles.price}>{formattedPrice}</Text>

        {/* Location (Baner, Pune) & Map Action */}
        <View style={styles.locationRow}>
          <View style={styles.locationTextGroup}>
            <Feather
              name="map-pin"
              size={13}
              color="#64748B"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.location.neighborhood}, {property.location.city}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleOpenMap}
            style={styles.mapActionBtn}
            accessibilityLabel={`Open ${property.title} location on Google Maps`}
          >
            <Feather name="map" size={11} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.mapActionText}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Specs Footer: Beds • Baths • Area */}
        <View style={styles.specsRow}>
          {property.specs.bedrooms > 0 ? (
            <>
              <View style={styles.specItem}>
                <Feather name="moon" size={12} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.specText}>{property.specs.bedrooms} Beds</Text>
              </View>
              <Text style={styles.specDot}>•</Text>
              <View style={styles.specItem}>
                <Feather name="droplet" size={12} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.specText}>{property.specs.bathrooms} Baths</Text>
              </View>
              <Text style={styles.specDot}>•</Text>
            </>
          ) : null}
          <View style={styles.specItem}>
            <Feather name="maximize" size={12} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.specText}>{formatArea(property.specs.areaSqFt)}</Text>
          </View>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.09)',
        },
      } as any,
    }),
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  topRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  badgesGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '80%',
  },
  intentBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
  },
  intentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: BorderRadius.pill,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: BorderRadius.pill,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
        ':hover': { transform: 'scale(1.08)' },
      } as any,
    }),
  },
  heartBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 18,
  },
  categoryLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.cardTitle.fontSize,
    lineHeight: Typography.cardTitle.lineHeight,
    fontWeight: Typography.cardTitle.fontWeight,
    letterSpacing: Typography.cardTitle.letterSpacing,
    color: '#0F172A',
    marginBottom: 6,
  },
  price: {
    fontSize: Typography.cardPrice.fontSize,
    lineHeight: Typography.cardPrice.lineHeight,
    fontWeight: Typography.cardPrice.fontWeight,
    letterSpacing: Typography.cardPrice.letterSpacing,
    color: '#0F172A',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  locationTextGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': {
          backgroundColor: '#DBEAFE',
          borderColor: '#93C5FD',
        },
      } as any,
    }),
  },
  mapActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  specDot: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
});
