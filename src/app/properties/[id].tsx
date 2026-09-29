import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { Container } from '@/components/common/Container';
import { ImageGallery } from '@/components/property/ImageGallery';
import { PropertySpecs } from '@/components/property/PropertySpecs';
import { AmenitiesList } from '@/components/property/AmenitiesList';
import { AgentCard } from '@/components/property/AgentCard';
import { PublicEnquiryForm } from '@/components/property/PublicEnquiryForm';
import { Badge } from '@/components/common/Badge';
import { propertyService } from '@/services/propertyService';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { apiClient } from '@/services/apiClient';
import { Property } from '@/types/property';
import { formatCurrency, formatArea } from '@/utils/formatters';
import { GooglePropertyMap } from '@/components/map/GooglePropertyMap';
import { getPropertyMapUrl, getPropertyDirectionsUrl, openExternalMap } from '@/utils/mapUtils';

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [property, setProperty] = useState<Property | undefined>(() =>
    propertyService.getById(id as string)
  );
  const [isLoading, setIsLoading] = useState(!property);

  React.useEffect(() => {
    const cached = propertyService.getById(id as string);
    if (cached) {
      setProperty(cached);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiClient.get<Property>(`/properties/${id}`).then((res) => {
      if (res.success && res.data) {
        setProperty(res.data);
      }
      setIsLoading(false);
    });
  }, [id]);

  if (!property) {
    if (isLoading) {
      return (
        <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#64748B' }}>Loading property details...</Text>
        </View>
      );
    }
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <View style={{ alignItems: 'center', maxWidth: 420, gap: 16, backgroundColor: '#FFFFFF', padding: 36, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.sm }}>
          <Feather name="alert-circle" size={48} color="#94A3B8" />
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' }}>
            Property Not Found
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 }}>
            The property listing you requested does not exist or may have been unpublished or removed.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/properties' as any)}
            style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: BorderRadius.md, marginTop: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              Explore Properties
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const favorited = isFavorite(property.id);

  const handleOpenEnquiry = () => {
    setEnquiryModalVisible(true);
  };

  const handleViewOnMap = () => {
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

  const handleGetDirections = () => {
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
    const url = getPropertyDirectionsUrl(locWithCoords, property.title);
    openExternalMap(url);
  };

  const handleShare = () => {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        navigator
          .share({
            title: property.title,
            text: `Explore ${property.title} in ${property.location.city} on Cityspace`,
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard?.writeText(window.location.href);
        window.alert('Listing link copied to clipboard!');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Container>
          {/* Top Navigation Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.navRight}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShare}
                style={styles.iconCircleBtn}
              >
                <Feather name="share-2" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleFavorite(property.id)}
                style={[
                  styles.iconCircleBtn,
                  favorited && styles.iconCircleBtnActive,
                ]}
              >
                <Ionicons
                  name={favorited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favorited ? '#EF4444' : Colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Gallery */}
          <ImageGallery images={property.images} />

          {/* Two-Column Responsive Layout */}
          <View
            style={[
              styles.layoutGrid,
              isDesktop ? styles.layoutDesktop : styles.layoutMobile,
            ]}
          >
            {/* Left Main Column: Story, Specs, Amenities, Map */}
            <View style={isDesktop ? styles.leftColDesktop : styles.leftColMobile}>
              {/* Header Info */}
              <View style={styles.headerInfo}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={property.type === 'buy' ? 'For Sale' : 'For Rent'}
                    variant="primary"
                  />
                  <Badge label={property.categoryLabel} variant="secondary" />
                  {property.verified && (
                    <Badge label="Verified Estate" variant="verified" />
                  )}
                  {property.featured && (
                    <Badge label="Featured" variant="featured" />
                  )}
                  {property.status === 'sold' && (
                    <View style={styles.soldBadge}>
                      <Text style={styles.soldBadgeText}>SOLD</Text>
                    </View>
                  )}
                  {property.status === 'rented' && (
                    <View style={styles.rentedBadge}>
                      <Text style={styles.rentedBadgeText}>RENTED</Text>
                    </View>
                  )}
                </View>

                <View style={styles.propIdRow}>
                  <Text style={styles.propIdText}>
                    PROPERTY ID: <Text style={{ fontWeight: '700' }}>{property.id.toUpperCase()}</Text>
                  </Text>
                </View>

                <Text style={styles.title}>{property.title}</Text>
                <Text style={styles.tagline}>{property.tagline}</Text>

                <View style={styles.locationRow}>
                  <Feather
                    name="map-pin"
                    size={16}
                    color={Colors.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.locationAddress}>
                    {property.location.address}, {property.location.neighborhood},{' '}
                    {property.location.city}
                    {property.location.state ? `, ${property.location.state}` : ''}
                    {property.location.pincode ? ` - ${property.location.pincode}` : ''}
                  </Text>
                </View>
              </View>

              {/* Mobile Price Display */}
              {!isDesktop && (
                <View style={styles.mobilePriceBlock}>
                  <Text style={styles.priceValue}>
                    {formatCurrency(
                      property.price,
                      property.currency,
                      property.type
                    )}
                  </Text>
                  <Text style={styles.priceSub}>
                    {property.type === 'rent'
                      ? 'Annual residential lease available'
                      : `≈ ₹${(property.price / 10000000).toFixed(2)} Cr (Inclusive of all legal documentation)`}
                  </Text>
                </View>
              )}

              {/* Specifications Matrix */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeader}>SPATIAL SPECIFICATIONS</Text>
                <PropertySpecs specs={property.specs} />

                <View style={styles.specsSubGrid}>
                  <View style={styles.subSpecItem}>
                    <Text style={styles.subSpecLabel}>Furnishing</Text>
                    <Text style={styles.subSpecValue}>
                      {property.specs.furnishing
                        ? property.specs.furnishing.replace('-', ' ').toUpperCase()
                        : 'SEMI-FURNISHED'}
                    </Text>
                  </View>

                  <View style={styles.subSpecItem}>
                    <Text style={styles.subSpecLabel}>Parking Capacity</Text>
                    <Text style={styles.subSpecValue}>
                      {property.specs.parkingSpaces} Vehicles
                    </Text>
                  </View>

                  <View style={styles.subSpecItem}>
                    <Text style={styles.subSpecLabel}>Year Built</Text>
                    <Text style={styles.subSpecValue}>
                      {property.specs.yearBuilt}
                    </Text>
                  </View>

                  <View style={styles.subSpecItem}>
                    <Text style={styles.subSpecLabel}>Verification Status</Text>
                    <Text style={[styles.subSpecValue, { color: '#0284C7' }]}>
                      {property.verified ? 'Legally Verified ✓' : 'Standard'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Architectural Narrative */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeader}>ARCHITECTURAL NARRATIVE</Text>
                <Text style={styles.descriptionText}>
                  {property.description}
                </Text>
              </View>

              {/* Amenities Grid */}
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeader}>CURATED AMENITIES</Text>
                <AmenitiesList amenities={property.amenities} />
              </View>

              {/* Location & Neighborhood Map */}
              <View style={styles.sectionCard}>
                <View style={styles.locationHeaderRow}>
                  <Text style={styles.cardHeader}>LOCATION & GEOGRAPHY</Text>
                  <View style={styles.mapActionGroup}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleViewOnMap}
                      style={styles.viewOnMapBtn}
                      accessibilityLabel="View exact property location on Google Maps"
                    >
                      <Feather name="external-link" size={13} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.viewOnMapBtnText}>View on Map</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleGetDirections}
                      style={styles.getDirectionsBtn}
                      accessibilityLabel="Start directions to property on Google Maps"
                    >
                      <Feather name="navigation" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.getDirectionsBtnText}>Start Direction</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Map Container - clicking opens location in Google Maps */}
                <TouchableOpacity
                  activeOpacity={0.96}
                  onPress={handleViewOnMap}
                  style={styles.mapClickWrapper}
                  accessibilityLabel="Click map to view in Google Maps"
                >
                  <GooglePropertyMap
                    latitude={property.location?.coordinates?.lat || 18.5204}
                    longitude={property.location?.coordinates?.lng || 73.8567}
                    height={300}
                    isInteractive={false}
                    locationVisibility={property.locationVisibility || 'PUBLIC_EXACT'}
                    title={property.title}
                    address={`${property.location?.address || ''}, ${property.location?.city || ''}`}
                  />
                  <View style={styles.mapClickBadge}>
                    <Feather name="maximize-2" size={11} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.mapClickBadgeText}>Click map to open in Google Maps</Text>
                  </View>
                </TouchableOpacity>

                {/* Location metadata (strictly NO coordinates displayed) */}
                <View style={styles.coordRow}>
                  <View style={styles.locationMetaAddress}>
                    <Feather name="map-pin" size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.locationFullAddress}>
                      {property.location?.address
                        ? `${property.location.address}, ${property.location.neighborhood || property.location.city}, ${property.location.city}`
                        : `${property.location?.neighborhood || ''}, ${property.location?.city || ''}`}
                    </Text>
                  </View>
                  {property.location?.pincode ? (
                    <Text style={styles.coordText}>
                      PIN: {property.location.pincode}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Mobile Agent Section */}
              {!isDesktop && (
                <View style={{ marginTop: 8, gap: 16 }}>
                  <AgentCard
                    agent={property.agent}
                    propertyTitle={property.title}
                    onSendEnquiry={handleOpenEnquiry}
                  />

                  {/* Mobile Embedded Enquiry Form */}
                  <PublicEnquiryForm
                    propertyId={property.id}
                    propertyTitle={property.title}
                    assignedAgentId={property.assignedAgentId || property.agent.id}
                  />
                </View>
              )}
            </View>

            {/* Right Sticky Sidebar (Desktop only) */}
            {isDesktop && (
              <View style={styles.rightColDesktop}>
                <View style={styles.stickyPriceBox}>
                  <Text style={styles.sidebarOverline}>LISTING VALUATION</Text>
                  <Text style={styles.desktopPrice}>
                    {formatCurrency(
                      property.price,
                      property.currency,
                      property.type
                    )}
                  </Text>
                  <Text style={styles.desktopPriceSub}>
                    {property.type === 'rent'
                      ? 'Fully serviced residential lease terms'
                      : `Estimated ₹${(property.price / 10000000).toFixed(2)} Crore (All-inclusive)`}
                  </Text>

                  <View style={styles.sidebarDivider} />

                  {/* Agent Presentation & Contact Actions */}
                  <AgentCard
                    agent={property.agent}
                    propertyTitle={property.title}
                    onSendEnquiry={handleOpenEnquiry}
                  />

                  {/* Direct Public Enquiry Form (Zero Login) */}
                  <View style={{ marginTop: 16 }}>
                    <PublicEnquiryForm
                      propertyId={property.id}
                      propertyTitle={property.title}
                      assignedAgentId={property.assignedAgentId || property.agent.id}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Container>
      </ScrollView>

      {/* Floating Bottom Bar for Mobile */}
      {!isDesktop && (
        <View style={styles.mobileFloatingBar}>
          <View>
            <Text style={styles.mobileFloatingPrice}>
              {formatCurrency(property.price, property.currency, property.type)}
            </Text>
            <Text style={styles.mobileFloatingSub}>
              {property.status === 'sold' ? 'Sold Out' : 'Verified Listing'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenEnquiry}
            style={styles.mobileEnquireBtn}
          >
            <Feather name="mail" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.mobileEnquireBtnText}>SEND ENQUIRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Send Enquiry Modal for Instant Pop-up */}
      <Modal
        visible={enquiryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEnquiryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalHeading}>Enquire About Property</Text>
              <TouchableOpacity
                onPress={() => setEnquiryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <PublicEnquiryForm
              propertyId={property.id}
              propertyTitle={property.title}
              assignedAgentId={property.assignedAgentId || property.agent.id}
              onSuccess={() => {
                setTimeout(() => setEnquiryModalVisible(false), 2500);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  iconCircleBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  layoutGrid: {
    marginTop: 24,
    gap: 24,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  layoutMobile: {
    flexDirection: 'column',
  },
  leftColDesktop: {
    flex: 1,
    maxWidth: '65%',
    gap: 20,
  },
  leftColMobile: {
    width: '100%',
    gap: 16,
  },
  rightColDesktop: {
    width: '35%',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 24,
      } as any,
    }),
  },
  stickyPriceBox: {
    gap: 16,
  },
  sidebarOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  desktopPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  desktopPriceSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: -8,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  headerInfo: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  soldBadge: {
    backgroundColor: '#DC2626',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  rentedBadge: {
    backgroundColor: '#D97706',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  rentedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  propIdRow: {
    marginTop: 2,
  },
  propIdText: {
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationAddress: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  mobilePriceBlock: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  priceSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 16,
    ...Shadows.sm,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#0284C7',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  specsSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  subSpecItem: {
    flex: 1,
    minWidth: 140,
    gap: 2,
  },
  subSpecLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  subSpecValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mapMockup: {
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  mapPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  mapPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  mapBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  mapActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': { backgroundColor: '#DBEAFE' },
      } as any,
    }),
  },
  viewOnMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  getDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': { backgroundColor: '#1D4ED8' },
      } as any,
    }),
  },
  getDirectionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapClickWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  mapClickBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  mapClickBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  locationMetaAddress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 220,
  },
  locationFullAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  coordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  mobileFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.elevated,
  },
  mobileFloatingPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mobileFloatingSub: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  mobileEnquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  mobileEnquireBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 24,
    gap: 16,
    ...Shadows.elevated,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  mobileQuickCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
});

