import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LeafletPropertyMap } from './LeafletPropertyMap';
import { searchAddress, GeoapifyPlace } from '@/services/geoapifyService';

interface SelectOnMapModalProps {
  visible: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  onConfirm: (locationData: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    googlePlaceId?: string;
    name?: string;
  }) => void;
}

export const SelectOnMapModal: React.FC<SelectOnMapModalProps> = ({
  visible,
  onClose,
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
}) => {
  const [currentLat, setCurrentLat] = useState(initialLat || 18.5204);
  const [currentLng, setCurrentLng] = useState(initialLng || 73.8567);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');

  // Modal search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoapifyPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync with initial props when opened
  useEffect(() => {
    if (visible) {
      setCurrentLat(Number.isFinite(initialLat) && initialLat !== 0 ? initialLat : 18.5204);
      setCurrentLng(Number.isFinite(initialLng) && initialLng !== 0 ? initialLng : 73.8567);
      setSelectedAddress(initialAddress || '');
      setSearchQuery('');
      setSuggestions([]);
      setSearchError(null);
    }
  }, [visible, initialLat, initialLng, initialAddress]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSearchError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim() || text.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(text);
        setSuggestions(results);
        if (results.length === 0) {
          setSearchError('No locations found in India. Try adjusting your search.');
        }
      } catch (err) {
        console.error('[SelectOnMapModal] Autocomplete error:', err);
        setSearchError('Search service temporarily unavailable.');
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (place: GeoapifyPlace) => {
    setCurrentLat(place.lat);
    setCurrentLng(place.lon);
    const resolvedAddress = place.formatted || [place.name, place.address_line1, place.suburb].filter(Boolean).join(', ');
    setSelectedAddress(resolvedAddress);
    if (place.name || place.primary_text) setPlaceName(place.name || place.primary_text);
    if (place.place_id) setGooglePlaceId(place.place_id);
    if (place.city) setCity(place.city);
    if (place.state) setState(place.state);
    setPincode(place.postcode || '');
    setSearchQuery('');
    setSuggestions([]);
    setSearchError(null);
  };

  const handleLocationChange = (result: {
    lat: number;
    lng: number;
    place?: GeoapifyPlace | null;
  }) => {
    // Exact Leaflet clicked / dragged coordinates
    setCurrentLat(result.lat);
    setCurrentLng(result.lng);
    if (result.place) {
      const resolvedAddress = result.place.formatted || [result.place.name, result.place.address_line1, result.place.suburb].filter(Boolean).join(', ');
      setSelectedAddress(resolvedAddress);
      if (result.place.name || result.place.primary_text) setPlaceName(result.place.name || result.place.primary_text);
      if (result.place.place_id) setGooglePlaceId(result.place.place_id);
      if (result.place.city) setCity(result.place.city);
      if (result.place.state) setState(result.place.state);
      setPincode(result.place.postcode || '');
    }
  };

  const handleConfirm = () => {
    onConfirm({
      lat: currentLat,
      lng: currentLng,
      address: selectedAddress,
      city: city || undefined,
      state: state || undefined,
      pincode: pincode,
      googlePlaceId: googlePlaceId || undefined,
      name: placeName || undefined,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Feather name="map-pin" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Select Location on Map</Text>
                <Text style={styles.headerSubtitle}>
                  Search an address or click and drag the pin on the map
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close map dialog"
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search area, landmark, or street in India..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={handleSearchChange}
                style={styles.searchInput}
              />
              {isSearching && <ActivityIndicator size="small" color="#2563EB" />}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.suggestionsScroll}
                >
                  {suggestions.map((item, idx) => {
                    const isBuildingOrAmenity =
                      item.result_type === 'building' ||
                      item.result_type === 'amenity' ||
                      item.result_type === 'commercial' ||
                      item.result_type === 'residential' ||
                      item.result_type === 'place';
                    return (
                      <TouchableOpacity
                        key={item.place_id || idx}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestionIconWrap}>
                          <Feather
                            name={isBuildingOrAmenity ? 'home' : 'map-pin'}
                            size={14}
                            color="#2563EB"
                          />
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text style={styles.suggestionTitle} numberOfLines={1}>
                            {item.primary_text || item.address_line1 || item.formatted.split(',')[0]}
                          </Text>
                          <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                            {item.secondary_text || item.address_line2 || item.formatted}
                          </Text>
                        </View>
                        {item.result_type && item.result_type !== 'unknown' && (
                          <View style={styles.suggestionTypeBadge}>
                            <Text style={styles.suggestionTypeBadgeText}>
                              {item.result_type.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {searchError && (
              <Text style={styles.searchErrorText}>{searchError}</Text>
            )}
          </View>

          {/* Map */}
          <View style={styles.mapWrapper}>
            <LeafletPropertyMap
              latitude={currentLat}
              longitude={currentLng}
              height="100%"
              isInteractive={true}
              showNearbyControls={true}
              onLocationChange={handleLocationChange}
            />
          </View>

          {/* Selected Address Display */}
          <View style={styles.selectedAddressCard}>
            <Feather name="check-circle" size={16} color="#16A34A" style={{ marginTop: 2, marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedLabel}>SELECTED LOCATION</Text>
              <Text style={styles.selectedAddressText} numberOfLines={2}>
                {selectedAddress || 'Click anywhere on the map to choose location'}
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                !selectedAddress && styles.confirmButtonDisabled,
              ]}
              disabled={!selectedAddress}
            >
              <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    zIndex: 50,
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  suggestionTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
  },
  suggestionTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  searchErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    paddingLeft: 4,
  },
  mapWrapper: {
    flex: 1,
    minHeight: 380,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  selectedAddressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#166534',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  confirmButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
