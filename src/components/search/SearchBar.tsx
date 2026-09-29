import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { ListingType } from '@/types/property';
import { useResponsive } from '@/hooks/useResponsive';

export interface SearchBarProps {
  initialType?: ListingType;
  initialQuery?: string;
  onSearch?: (type: ListingType, location: string, propertyType: string) => void;
  onOpenFilter?: () => void;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialType = 'buy',
  onSearch,
  onOpenFilter,
  compact = false,
}) => {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [transactionType, setTransactionType] = useState<ListingType>(initialType);
  const [location, setLocation] = useState('Pune');
  const [propertyType, setPropertyType] = useState('All Types');
  const [maxPrice, setMaxPrice] = useState('');

  const propertyTypes = ['All Types', 'Apartments', 'Villas', 'Plots', 'Houses', 'Commercial'];

  const cyclePropertyType = () => {
    const currentIndex = propertyTypes.indexOf(propertyType);
    const nextIndex = (currentIndex + 1) % propertyTypes.length;
    setPropertyType(propertyTypes[nextIndex]);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(transactionType, location, propertyType);
    } else {
      router.push({
        pathname: '/properties',
        params: {
          type: transactionType,
          city: location,
          category: propertyType === 'All Types' ? undefined : propertyType.toLowerCase(),
          maxPrice: maxPrice || undefined,
        },
      } as any);
    }
  };

  // Compact layout for secondary headers/screens
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Feather name="map-pin" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Location (e.g. Pune)"
          placeholderTextColor={Colors.textMuted}
          style={styles.compactInput}
        />
        {onOpenFilter && (
          <TouchableOpacity onPress={onOpenFilter} style={styles.compactFilterBtn}>
            <Feather name="sliders" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSearch} style={styles.compactBtn}>
          <Feather name="search" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // Unified Premium Search Panel
  // Desktop: [ Location ] [ Property Type ] [ Buy/Rent ] [ Price ] [ Search ]
  return (
    <View
      style={[
        styles.panel,
        isDesktop ? styles.panelDesktop : styles.panelMobile,
      ]}
    >
      {/* 1. Location */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>LOCATION</Text>
        <View style={styles.fieldRow}>
          <Feather name="map-pin" size={15} color="#0F172A" style={styles.fieldIcon} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="City, locality (e.g. Baner)"
            placeholderTextColor="#94A3B8"
            style={styles.fieldInput}
          />
        </View>
      </View>

      {isDesktop && <View style={styles.divider} />}

      {/* 2. Property Type */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={cyclePropertyType}
        style={styles.fieldSection}
      >
        <Text style={styles.fieldLabel}>PROPERTY TYPE</Text>
        <View style={styles.fieldRow}>
          <Feather name="home" size={15} color="#475569" style={styles.fieldIcon} />
          <Text style={styles.fieldSelectedText} numberOfLines={1}>
            {propertyType}
          </Text>
          <Feather name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>

      {isDesktop && <View style={styles.divider} />}

      {/* 3. Buy / Rent */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>LISTING TYPE</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTransactionType('buy')}
            style={[
              styles.segmentBtn,
              transactionType === 'buy' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                transactionType === 'buy' && styles.segmentBtnTextActive,
              ]}
            >
              Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTransactionType('rent')}
            style={[
              styles.segmentBtn,
              transactionType === 'rent' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                transactionType === 'rent' && styles.segmentBtnTextActive,
              ]}
            >
              Rent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isDesktop && <View style={styles.divider} />}

      {/* 4. Price / Budget */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>MAX BUDGET</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            value={maxPrice}
            onChangeText={setMaxPrice}
            placeholder="Any Price"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            style={styles.fieldInput}
          />
        </View>
      </View>

      {/* 5. Search Button (Pixel-perfect aligned) */}
      <TouchableOpacity
        onPress={handleSearch}
        activeOpacity={0.88}
        style={[styles.searchBtn, !isDesktop && styles.searchBtnMobile]}
      >
        <Feather name="search" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.searchBtnText}>Search</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 6,
  },
  panelDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 18,
    gap: 4,
  },
  panelMobile: {
    flexDirection: 'column',
    padding: 18,
    gap: 14,
  },
  fieldSection: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 110,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#94A3B8',
    marginBottom: 3,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    marginRight: 7,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 2,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  fieldSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.sm,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 48,
    paddingHorizontal: 26,
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': {
          backgroundColor: '#1E293B',
          transform: 'translateY(-1px)',
        },
      } as any,
    }),
  },
  searchBtnMobile: {
    width: '100%',
    marginTop: 4,
    height: 48,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingLeft: 12,
    paddingRight: 4,
    height: 44,
  },
  compactInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  compactFilterBtn: {
    padding: 8,
    marginRight: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  compactBtn: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
