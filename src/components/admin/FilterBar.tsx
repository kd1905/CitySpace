import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { PropertyStatus } from '@/types/property';

import { propertyService } from '@/services/propertyService';

export interface FilterState {
  search: string;
  status: PropertyStatus | 'all';
  category: string;
  listingType: 'all' | 'buy' | 'rent';
  city: string;
  featured: boolean | 'all';
  verified: boolean | 'all';
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const dynamicCities = Array.from(
    new Set(
      propertyService
        .getAllAdmin()
        .map((p) => p.location?.city?.trim())
        .filter(Boolean)
    )
  ) as string[];
  const cities = ['All', ...dynamicCities];
  const categories = [
    { id: 'all', label: 'All Types' },
    { id: 'apartments', label: 'Apartments' },
    { id: 'houses', label: 'Houses' },
    { id: 'villas', label: 'Villas' },
    { id: 'plots', label: 'Plots' },
    { id: 'offices', label: 'Offices' },
    { id: 'commercial', label: 'Commercial' },
  ];

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.listingType !== 'all' ||
    filters.city !== 'All' ||
    filters.featured !== 'all' ||
    filters.verified !== 'all';

  return (
    <View style={styles.container}>
      {/* Top Search & Primary Filters Row */}
      <View style={styles.mainRow}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search properties by title, address, or ID..."
            placeholderTextColor="#94A3B8"
            value={filters.search}
            onChangeText={(text) => updateFilter('search', text)}
            style={styles.input}
          />
          {filters.search.length > 0 && (
            <TouchableOpacity onPress={() => updateFilter('search', '')}>
              <Feather name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Pill Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPillsRow}
        >
          {(['all', 'published', 'draft', 'unpublished', 'sold', 'rented'] as const).map((st) => {
            const isSelected = filters.status === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => updateFilter('status', st)}
                style={[styles.statusPill, isSelected && styles.statusPillActive]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isSelected && styles.statusPillTextActive,
                  ]}
                >
                  {st === 'all'
                    ? 'All Status'
                    : st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Toggle Filters Button */}
        <TouchableOpacity
          onPress={() => setShowMoreFilters(!showMoreFilters)}
          style={[styles.filterToggleBtn, showMoreFilters && styles.filterToggleBtnActive]}
        >
          <Feather
            name="sliders"
            size={14}
            color={showMoreFilters ? '#0F172A' : Colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterToggleText,
              showMoreFilters && styles.filterToggleTextActive,
            ]}
          >
            Filters
          </Text>
          {hasActiveFilters && <View style={styles.activeDot} />}
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={onReset} style={styles.resetBtn}>
            <Feather name="rotate-ccw" size={13} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.resetBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded Multi-Filter Section */}
      {showMoreFilters && (
        <View style={styles.expandedFilters}>
          {/* Listing Type: Buy / Rent */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>LISTING TYPE</Text>
            <View style={styles.chipGroup}>
              {[
                { id: 'all', label: 'All' },
                { id: 'buy', label: 'Buy' },
                { id: 'rent', label: 'Rent' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => updateFilter('listingType', t.id as any)}
                  style={[
                    styles.filterChip,
                    filters.listingType === t.id && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.listingType === t.id && styles.filterChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Property Category */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>PROPERTY TYPE</Text>
            <View style={styles.chipGroup}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => updateFilter('category', c.id)}
                  style={[
                    styles.filterChip,
                    filters.category === c.id && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.category === c.id && styles.filterChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* City / Location */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>LOCATION</Text>
            <View style={styles.chipGroup}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  onPress={() => updateFilter('city', city)}
                  style={[
                    styles.filterChip,
                    filters.city === city && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.city === city && styles.filterChipTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Badges Toggles: Featured & Verified */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>SPECIAL FLAGS</Text>
            <View style={styles.chipGroup}>
              <TouchableOpacity
                onPress={() =>
                  updateFilter(
                    'featured',
                    filters.featured === true ? 'all' : true
                  )
                }
                style={[
                  styles.filterChip,
                  filters.featured === true && styles.filterChipActiveFeatured,
                ]}
              >
                <Feather
                  name="star"
                  size={12}
                  color={filters.featured === true ? '#B45309' : '#64748B'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filters.featured === true && { color: '#B45309', fontWeight: '700' },
                  ]}
                >
                  Featured Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  updateFilter(
                    'verified',
                    filters.verified === true ? 'all' : true
                  )
                }
                style={[
                  styles.filterChip,
                  filters.verified === true && styles.filterChipActiveVerified,
                ]}
              >
                <Feather
                  name="shield"
                  size={12}
                  color={filters.verified === true ? '#0369A1' : '#64748B'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filters.verified === true && { color: '#0369A1', fontWeight: '700' },
                  ]}
                >
                  Verified Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Results Count Banner if available */}
      {totalResults !== undefined && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing <Text style={styles.countBold}>{totalResults}</Text> properties
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  statusPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  filterToggleBtnActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterToggleTextActive: {
    color: '#0F172A',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginLeft: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  expandedFilters: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 14,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    minWidth: 110,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveFeatured: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  filterChipActiveVerified: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
  },
  countBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
