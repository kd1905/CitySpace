import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useResponsive } from '@/hooks/useResponsive';
import { ListingType } from '@/types/property';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const { getFavoriteProperties, favoritesCount, clearFavorites } =
    useFavorites();

  const [activeFilter, setActiveFilter] = useState<'all' | ListingType>('all');

  const allFavorites = getFavoriteProperties();

  const filteredFavorites = allFavorites.filter((prop) => {
    if (activeFilter === 'all') return true;
    return prop.type === activeFilter;
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Container>
        {/* Screen Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>SAVED PORTFOLIO</Text>
            <Text style={styles.title}>Your Curated Collection</Text>
          </View>

          {favoritesCount > 0 && (
            <TouchableOpacity
              onPress={clearFavorites}
              style={styles.clearBtn}
            >
              <Feather name="trash-2" size={14} color={Colors.textSecondary} />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        {favoritesCount > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterPill,
                activeFilter === 'all' && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                All Spaces ({favoritesCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('buy')}
              style={[
                styles.filterPill,
                activeFilter === 'buy' && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'buy' && styles.filterPillTextActive,
                ]}
              >
                For Sale (
                {allFavorites.filter((p) => p.type === 'buy').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('rent')}
              style={[
                styles.filterPill,
                activeFilter === 'rent' && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'rent' && styles.filterPillTextActive,
                ]}
              >
                For Lease (
                {allFavorites.filter((p) => p.type === 'rent').length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {filteredFavorites.length > 0 ? (
          <View
            style={[
              styles.grid,
              isDesktop
                ? styles.gridDesktop
                : isTablet
                  ? styles.gridTablet
                  : styles.gridMobile,
            ]}
          >
            {filteredFavorites.map((prop) => (
              <View
                key={prop.id}
                style={[
                  styles.gridItem,
                  {
                    width: isDesktop ? '31.8%' : isTablet ? '48%' : '100%',
                  },
                ]}
              >
                <PropertyCard property={prop} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="heart" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No saved spaces yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the heart icon on any architectural property while exploring to
              curate your personal real estate portfolio.
            </Text>
            <Button
              title="Explore Featured Properties"
              onPress={() => router.push('/(tabs)')}
              variant="primary"
              size="lg"
              icon="compass"
              style={{ marginTop: 24 }}
            />
          </View>
        )}
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.accent,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridDesktop: {
    gap: 24,
  },
  gridTablet: {
    gap: 16,
  },
  gridMobile: {
    gap: 20,
  },
  gridItem: {
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 24,
  },
});
