import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CategoryPills } from '@/components/search/CategoryPills';
import { FilterModal } from '@/components/search/FilterModal';
import { SearchBar } from '@/components/search/SearchBar';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { propertyService } from '@/services/propertyService';
import { PropertyFilterState, SortOption } from '@/types/filter';
import { ListingType, PropertyCategoryType } from '@/types/property';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const { isDesktop, isTablet } = useResponsive();

  const [filters, setFilters] = useState<PropertyFilterState>({
    query: (params.query as string) || '',
    type: (params.type as ListingType) || 'buy',
    category: (params.category as PropertyCategoryType) || 'all',
    city: (params.city as string) || undefined,
    bedrooms: params.bedrooms ? Number(params.bedrooms) : 'any',
    bathrooms: params.bathrooms ? Number(params.bathrooms) : 'any',
    amenities: params.amenities ? (params.amenities as string).split(',') : [],
    sortBy: (params.sort as SortOption) || 'featured',
  });

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Real-time filtered properties
  const results = useMemo(() => {
    return propertyService.search(filters);
  }, [filters]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Interior Size', value: 'size-desc' },
  ];

  const handleResetFilters = () => {
    setFilters({
      query: '',
      type: 'buy',
      category: 'all',
      sortBy: 'featured',
      amenities: [],
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Container>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.overline}>PROPERTY DISCOVERY</Text>
          <Text style={styles.title}>Search Architectural Spaces</Text>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              compact
              initialQuery={filters.query}
              initialType={filters.type}
              onSearch={(_, q) => setFilters((prev) => ({ ...prev, query: q }))}
              onOpenFilter={() => setFilterModalVisible(true)}
            />
          </View>
        </View>

        {/* Transaction Type & Typology Bar */}
        <View style={styles.filterControlBar}>
          <View style={styles.typeSwitcher}>
            <TouchableOpacity
              onPress={() => setFilters((prev) => ({ ...prev, type: 'buy' }))}
              style={[
                styles.typePill,
                filters.type === 'buy' && styles.typePillActive,
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  filters.type === 'buy' && styles.typePillTextActive,
                ]}
              >
                For Sale
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilters((prev) => ({ ...prev, type: 'rent' }))}
              style={[
                styles.typePill,
                filters.type === 'rent' && styles.typePillActive,
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  filters.type === 'rent' && styles.typePillTextActive,
                ]}
              >
                For Lease
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.moreFiltersBtn}
          >
            <Feather name="sliders" size={15} color={Colors.textPrimary} />
            <Text style={styles.moreFiltersText}>All Filters</Text>
            {filters.amenities.length > 0 && (
              <View style={styles.activeFilterCount}>
                <Text style={styles.activeFilterCountText}>
                  {filters.amenities.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <CategoryPills
          activeCategory={filters.category}
          onSelectCategory={(cat) =>
            setFilters((prev) => ({ ...prev, category: cat }))
          }
        />

        {/* Results Metadata & Sort Toolbar */}
        <View style={styles.toolbar}>
          <Text style={styles.resultsCount}>
            Showing <Text style={styles.countNumber}>{results.length}</Text>{' '}
            spaces
          </Text>

          {/* Sort Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScroll}
          >
            {sortOptions.map((opt) => {
              const isSelected = filters.sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, sortBy: opt.value }))
                  }
                  style={[
                    styles.sortPill,
                    isSelected && styles.sortPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortPillText,
                      isSelected && styles.sortPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Properties Grid */}
        {results.length > 0 ? (
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
            {results.map((prop) => (
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
              <Feather name="search" size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching spaces found</Text>
            <Text style={styles.emptyDesc}>
              Try relaxing your filters, searching for a different city, or
              switching between sale and lease options.
            </Text>
            <Button
              title="Reset All Filters"
              onPress={handleResetFilters}
              variant="outline"
              size="md"
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </Container>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={handleResetFilters}
      />
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
  header: {
    marginBottom: 20,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  typePillActive: {
    backgroundColor: Colors.primary,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  moreFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  moreFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activeFilterCount: {
    backgroundColor: Colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 8,
    gap: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  countNumber: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sortScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  sortPillActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sortPillTextActive: {
    fontWeight: '700',
    color: Colors.primary,
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 22,
  },
});
