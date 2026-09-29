import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { PropertyFilterState } from '@/types/filter';
import { FurnishingStatus } from '@/types/property';
import { Button } from '@/components/common/Button';

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: PropertyFilterState;
  onApply: (filters: PropertyFilterState) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<PropertyFilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const bedroomOptions = ['any', 1, 2, 3, 4, 5];
  const bathroomOptions = ['any', 1, 2, 3, 4];
  const parkingOptions = ['any', 1, 2, 3];
  const furnishingOptions: { id: FurnishingStatus | 'any'; label: string }[] = [
    { id: 'any', label: 'Any' },
    { id: 'unfurnished', label: 'Unfurnished' },
    { id: 'semi-furnished', label: 'Semi-Furnished' },
    { id: 'fully-furnished', label: 'Fully Furnished' },
  ];

  const amenityOptions = [
    { id: 'parking', label: 'Reserved Covered Parking' },
    { id: 'security', label: '24/7 Gated Security' },
    { id: 'pool', label: 'Infinity Swimming Pool' },
    { id: 'gym', label: 'Modern Fitness Center' },
    { id: 'clubhouse', label: 'Exclusive Clubhouse' },
    { id: 'garden', label: 'Landscaped Garden' },
    { id: 'backup', label: 'Full Power Backup' },
    { id: 'cctv', label: 'CCTV Surveillance' },
    { id: 'lift', label: 'High-speed Elevators' },
    { id: 'balcony', label: 'Private Balcony' },
  ];

  const toggleAmenity = (id: string) => {
    setLocalFilters((prev) => {
      const exists = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== id)
          : [...prev.amenities, id],
      };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Refine Property Search</Text>
              <Text style={styles.headerSubtitle}>
                Filter by price, spatial configuration, amenities, and legal verification
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={true}>
            {/* Listing Type: Buy / Rent */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRANSACTION TYPE</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({ ...prev, type: 'buy' }))
                  }
                  style={[
                    styles.toggleBtn,
                    localFilters.type === 'buy' && styles.toggleBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      localFilters.type === 'buy' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Buy (For Sale)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({ ...prev, type: 'rent' }))
                  }
                  style={[
                    styles.toggleBtn,
                    localFilters.type === 'rent' && styles.toggleBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      localFilters.type === 'rent' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Rent (For Lease)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BUDGET RANGE (₹ INR)</Text>
              <View style={styles.inputsRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputSubLabel}>MINIMUM PRICE (₹)</Text>
                  <TextInput
                    placeholder="e.g. 5000000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={localFilters.minPrice ? String(localFilters.minPrice) : ''}
                    onChangeText={(val) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        minPrice: val ? Number(val) : undefined,
                      }))
                    }
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={styles.inputSubLabel}>MAXIMUM PRICE (₹)</Text>
                  <TextInput
                    placeholder="e.g. 35000000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={localFilters.maxPrice ? String(localFilters.maxPrice) : ''}
                    onChangeText={(val) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxPrice: val ? Number(val) : undefined,
                      }))
                    }
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Area */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MINIMUM AREA (SQ FT)</Text>
              <View style={styles.pillGroup}>
                {['any', 800, 1200, 1800, 2500, 3500].map((area) => {
                  const isSelected =
                    area === 'any'
                      ? !localFilters.minArea
                      : localFilters.minArea === area;
                  return (
                    <TouchableOpacity
                      key={String(area)}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          minArea: area === 'any' ? undefined : (area as number),
                        }))
                      }
                      style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {area === 'any' ? 'Any Area' : `${area}+ sq.ft`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bedrooms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BEDROOMS</Text>
              <View style={styles.pillGroup}>
                {bedroomOptions.map((opt) => {
                  const isSelected =
                    opt === 'any'
                      ? !localFilters.bedrooms || localFilters.bedrooms === 'any'
                      : localFilters.bedrooms === opt;
                  return (
                    <TouchableOpacity
                      key={String(opt)}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          bedrooms: opt as any,
                        }))
                      }
                      style={[
                        styles.pillOption,
                        isSelected && styles.pillOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {opt === 'any' ? 'Any' : `${opt} BHK`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bathrooms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BATHROOMS</Text>
              <View style={styles.pillGroup}>
                {bathroomOptions.map((opt) => {
                  const isSelected =
                    opt === 'any'
                      ? !localFilters.bathrooms || localFilters.bathrooms === 'any'
                      : localFilters.bathrooms === opt;
                  return (
                    <TouchableOpacity
                      key={String(opt)}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          bathrooms: opt as any,
                        }))
                      }
                      style={[
                        styles.pillOption,
                        isSelected && styles.pillOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {opt === 'any' ? 'Any' : `${opt}+ Baths`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Furnishing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FURNISHING STATUS</Text>
              <View style={styles.pillGroup}>
                {furnishingOptions.map((f) => {
                  const isSelected =
                    f.id === 'any'
                      ? !localFilters.furnishing || localFilters.furnishing === 'any'
                      : localFilters.furnishing === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          furnishing: f.id,
                        }))
                      }
                      style={[
                        styles.pillOption,
                        isSelected && styles.pillOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Parking */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PARKING SLOTS</Text>
              <View style={styles.pillGroup}>
                {parkingOptions.map((opt) => {
                  const isSelected =
                    opt === 'any'
                      ? !localFilters.parking || localFilters.parking === 'any'
                      : localFilters.parking === opt;
                  return (
                    <TouchableOpacity
                      key={String(opt)}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          parking: opt as any,
                        }))
                      }
                      style={[
                        styles.pillOption,
                        isSelected && styles.pillOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {opt === 'any' ? 'Any Parking' : `${opt}+ Vehicles`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Verification & Promotion Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CURATION & TRUST</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      verified: prev.verified === true ? 'all' : true,
                    }))
                  }
                  style={[
                    styles.toggleBtn,
                    localFilters.verified === true && styles.toggleBtnVerified,
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={14}
                    color={localFilters.verified === true ? '#0284C7' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      localFilters.verified === true && styles.toggleBtnTextVerified,
                    ]}
                  >
                    Verified Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      featured: prev.featured === true ? 'all' : true,
                    }))
                  }
                  style={[
                    styles.toggleBtn,
                    localFilters.featured === true && styles.toggleBtnFeatured,
                  ]}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={localFilters.featured === true ? '#B45309' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      localFilters.featured === true && styles.toggleBtnTextFeatured,
                    ]}
                  >
                    Featured Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amenities Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AMENITIES & CONVENIENCES</Text>
              <View style={styles.amenitiesGrid}>
                {amenityOptions.map((amenity) => {
                  const checked = localFilters.amenities.includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      onPress={() => toggleAmenity(amenity.id)}
                      style={[
                        styles.amenityRow,
                        checked && styles.amenityRowChecked,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxChecked,
                        ]}
                      >
                        {checked && (
                          <Feather name="check" size={13} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.amenityLabel}>{amenity.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.footer}>
            <Button
              title="Reset All"
              onPress={handleReset}
              variant="outline"
              size="md"
              style={{ flex: 1, marginRight: 12 }}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              variant="primary"
              size="md"
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '88%',
    paddingBottom: Platform.select({ ios: 34, default: 24 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 24,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#0284C7',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleBtnVerified: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0284C7',
  },
  toggleBtnTextVerified: {
    color: '#0284C7',
    fontWeight: '700',
  },
  toggleBtnFeatured: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  toggleBtnTextFeatured: {
    color: '#B45309',
    fontWeight: '700',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillOptionActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  pillOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  amenitiesGrid: {
    gap: 8,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityRowChecked: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
