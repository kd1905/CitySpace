import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { Container } from '@/components/common/Container';
import { PropertyCard } from '@/components/property/PropertyCard';
import { FilterModal } from '@/components/search/FilterModal';
import { propertyService } from '@/services/propertyService';
import { PropertyFilterState, SortOption } from '@/types/filter';
import { ListingType, PropertyCategoryType } from '@/types/property';
import { Button } from '@/components/common/Button';

export default function PropertyResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDesktop, isTablet } = useResponsive();

  const [filters, setFilters] = useState<PropertyFilterState>({
    query: (params.query as string) || '',
    type: (params.type as ListingType) || 'buy',
    category: (params.category as PropertyCategoryType) || 'all',
    city: (params.city as string) || undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    bedrooms: params.bedrooms ? Number(params.bedrooms) : 'any',
    bathrooms: params.bathrooms ? Number(params.bathrooms) : 'any',
    amenities: params.amenities ? (params.amenities as string).split(',') : [],
    sortBy: (params.sort as SortOption) || 'featured',
  });

  // Sync route params changes (e.g. from header nav Buy, Rent, Commercial, Plots, or hero search)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      type: (params.type as ListingType) || (params.category ? prev.type : 'buy'),
      category: (params.category as PropertyCategoryType) || (params.type ? 'all' : prev.category) || 'all',
      query: typeof params.query === 'string' ? params.query : prev.query,
      city: typeof params.city === 'string' ? params.city : prev.city,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      bedrooms: params.bedrooms ? Number(params.bedrooms) : 'any',
    }));
  }, [params.type, params.category, params.query, params.city, params.minPrice, params.maxPrice, params.bedrooms]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    propertyService.refreshFromBackend().then(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  // Compute matched properties
  const results = useMemo(() => {
    return propertyService.search(filters);
  }, [filters, dataVersion]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Recommended', value: 'featured' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price Low to High', value: 'price-asc' },
    { label: 'Price High to Low', value: 'price-desc' },
  ];

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'buy',
      category: 'all',
      sortBy: 'featured',
      amenities: [],
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: 'any',
      bathrooms: 'any',
      minArea: undefined,
      furnishing: 'any',
      parking: 'any',
      verified: 'all',
      featured: 'all',
    });
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category !== 'all') count++;
    if (filters.city) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms && filters.bedrooms !== 'any') count++;
    if (filters.bathrooms && filters.bathrooms !== 'any') count++;
    if (filters.minArea) count++;
    if (filters.furnishing && filters.furnishing !== 'any') count++;
    if (filters.parking && filters.parking !== 'any') count++;
    if (filters.verified && filters.verified !== 'all') count++;
    if (filters.featured && filters.featured !== 'all') count++;
    if (filters.amenities.length > 0) count += filters.amenities.length;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Container>
        {/* Navigation Breadcrumb */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color={Colors.textPrimary} />
            <Text style={styles.backBtnText}>Back to Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Page Title & Status */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.overline}>
              {filters.type === 'buy' ? 'PROPERTIES FOR SALE' : 'PROPERTIES FOR LEASE'}
            </Text>
            <Text style={styles.pageTitle}>
              {filters.city
                ? `Spaces in ${filters.city}`
                : filters.category !== 'all'
                ? `Curated ${filters.category.toUpperCase()} Spaces`
                : 'Architectural Collection'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterBtn}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={16} color={Colors.textPrimary} />
            <Text style={styles.filterBtnText}>Filters</Text>
            {activeCount > 0 && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Desktop Clean Horizontal Quick-Filter Bar */}
        <View style={styles.quickFilterBar}>
          {/* Buy / Rent Quick Toggle */}
          <View style={styles.quickToggleGroup}>
            <TouchableOpacity
              onPress={() => setFilters((p) => ({ ...p, type: 'buy' }))}
              style={[
                styles.quickToggleBtn,
                filters.type === 'buy' && styles.quickToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.quickToggleText,
                  filters.type === 'buy' && styles.quickToggleTextActive,
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilters((p) => ({ ...p, type: 'rent' }))}
              style={[
                styles.quickToggleBtn,
                filters.type === 'rent' && styles.quickToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.quickToggleText,
                  filters.type === 'rent' && styles.quickToggleTextActive,
                ]}
              >
                Rent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bedrooms Quick Pills */}
          <View style={styles.quickPillsRow}>
            {['any', 2, 3, 4].map((b) => {
              const isSelected =
                b === 'any'
                  ? !filters.bedrooms || filters.bedrooms === 'any'
                  : filters.bedrooms === b;
              return (
                <TouchableOpacity
                  key={String(b)}
                  onPress={() =>
                    setFilters((p) => ({
                      ...p,
                      bedrooms: b as any,
                    }))
                  }
                  style={[
                    styles.quickPill,
                    isSelected && styles.quickPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickPillText,
                      isSelected && styles.quickPillTextActive,
                    ]}
                  >
                    {b === 'any' ? 'All Beds' : `${b} BHK`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Verified Toggle */}
          <TouchableOpacity
            onPress={() =>
              setFilters((p) => ({
                ...p,
                verified: p.verified === true ? 'all' : true,
              }))
            }
            style={[
              styles.quickPill,
              filters.verified === true && styles.quickPillVerified,
            ]}
          >
            <Feather
              name="check-circle"
              size={12}
              color={filters.verified === true ? '#0284C7' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.quickPillText,
                filters.verified === true && styles.quickPillTextVerified,
              ]}
            >
              Verified
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips */}
        {activeCount > 0 && (
          <View style={styles.activeChipsRow}>
            {filters.city && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>City: {filters.city}</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, city: undefined }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.category !== 'all' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Category: {filters.category}</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, category: 'all' }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.bedrooms && filters.bedrooms !== 'any' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{filters.bedrooms} BHK</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, bedrooms: 'any' }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.minPrice && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Min: ₹{filters.minPrice.toLocaleString()}</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, minPrice: undefined }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.maxPrice && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Max: ₹{filters.maxPrice.toLocaleString()}</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, maxPrice: undefined }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.verified === true && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Verified Only</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, verified: 'all' }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {filters.query !== '' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>"{filters.query}"</Text>
                <TouchableOpacity
                  onPress={() => setFilters((p) => ({ ...p, query: '' }))}
                >
                  <Feather name="x" size={13} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={clearFilters} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Toolbar: Count & Sort */}
        <View style={styles.toolbar}>
          <Text style={styles.countText}>
            <Text style={styles.countNumber}>{results.length}</Text> residences available
          </Text>

          {/* Sort Controls */}
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
                  style={[styles.sortPill, isSelected && styles.sortPillActive]}
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
              <Feather name="compass" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching properties</Text>
            <Text style={styles.emptyDesc}>
              No residences currently match all active criteria. Reset filters or
              submit a private off-market inquiry.
            </Text>
            <Button
              title="Reset Search Filters"
              onPress={clearFilters}
              variant="outline"
              size="md"
              style={{ marginTop: 20 }}
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
        onReset={clearFilters}
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
    paddingTop: 24,
    paddingBottom: 60,
  },
  breadcrumbRow: {
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.accent,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: Colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clearAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 24,
    gap: 16,
  },
  countText: {
    fontSize: 13,
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
    paddingVertical: 5,
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
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
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
  quickFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 12,
  },
  quickToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  quickToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.sm,
  },
  quickToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } as any,
    }),
  },
  quickToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickToggleTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  quickPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  quickPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  quickPillVerified: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickPillTextVerified: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
