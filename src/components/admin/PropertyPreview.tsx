import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Property, PropertyStatus } from '@/types/property';
import { formatCurrency, formatArea } from '@/utils/formatters';
import { PropertyStatusBadge } from './PropertyStatusBadge';

interface PropertyPreviewProps {
  property: Partial<Property>;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

export const PropertyPreview: React.FC<PropertyPreviewProps> = ({
  property,
  onSaveDraft,
  onPublish,
  isSubmitting = false,
  mode = 'create',
}) => {
  const coverImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : null;

  const price = property.price || 0;
  const currency = property.currency || 'INR';
  const type = property.type || 'buy';
  const formattedPrice = formatCurrency(price, currency, type);

  return (
    <View style={styles.container}>
      {/* Live Preview Banner */}
      <View style={styles.previewHeader}>
        <View style={styles.previewTag}>
          <Feather name="eye" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.previewTagText}>PUBLIC VIEW PREVIEW</Text>
        </View>
        <Text style={styles.previewSubtext}>
          This is exactly how this property listing will render to prospective buyers & tenants on Cityspace.
        </Text>
      </View>

      <View style={styles.contentGrid}>
        {/* Left Column: Simulated Public Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.columnTitle}>LISTING CARD VIEW</Text>
          <View style={styles.publicCard}>
            <View style={styles.imageWrapper}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="image" size={32} color="#94A3B8" />
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>No image added</Text>
                </View>
              )}

              {/* Floating Badges */}
              <View style={styles.cardBadges}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {property.categoryLabel || property.category || 'Apartment'}
                  </Text>
                </View>

                <View style={styles.floatingRight}>
                  {property.verified && (
                    <View style={styles.verifiedFloating}>
                      <Feather name="shield" size={11} color="#FFFFFF" />
                      <Text style={styles.verifiedFloatingText}>Verified</Text>
                    </View>
                  )}
                  {property.featured && (
                    <View style={styles.featuredFloating}>
                      <Feather name="star" size={11} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.listingBadge}>
                <Text style={styles.listingBadgeText}>
                  {type === 'buy' ? 'For Sale' : 'For Rent'}
                </Text>
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {property.title || 'Untitled Property Space'}
              </Text>
              <Text style={styles.cardPrice}>{formattedPrice}</Text>

              <View style={styles.cardLocationRow}>
                <Feather name="map-pin" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.cardLocationText} numberOfLines={1}>
                  {[property.location?.neighborhood, property.location?.city, property.location?.state]
                    .filter(Boolean)
                    .join(', ') || 'Location pending'}
                </Text>
              </View>

              {/* Specs Pills */}
              <View style={styles.specsRow}>
                {property.specs?.bedrooms !== undefined && (
                  <View style={styles.specItem}>
                    <Feather name="home" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.specText}>{property.specs.bedrooms} Beds</Text>
                  </View>
                )}
                {property.specs?.bathrooms !== undefined && (
                  <View style={styles.specItem}>
                    <Feather name="droplet" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.specText}>{property.specs.bathrooms} Baths</Text>
                  </View>
                )}
                {property.specs?.areaSqFt !== undefined && (
                  <View style={styles.specItem}>
                    <Feather name="maximize-2" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.specText}>{formatArea(property.specs.areaSqFt)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Right Column: Listing Data Summary & Inspection */}
        <View style={styles.detailsContainer}>
          <Text style={styles.columnTitle}>LISTING SPECIFICATIONS AUDIT</Text>

          <View style={styles.specsCard}>
            {/* Status overview */}
            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>LISTING STATUS</Text>
              <PropertyStatusBadge
                status={property.status || 'draft'}
                verified={property.verified}
                featured={property.featured}
              />
            </View>

            <View style={styles.divider} />

            {/* Description snippet */}
            <View style={styles.auditBlock}>
              <Text style={styles.auditLabel}>DESCRIPTION</Text>
              <Text style={styles.descriptionText} numberOfLines={4}>
                {property.description || 'No description provided.'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Location Specs */}
            <View style={styles.auditBlock}>
              <Text style={styles.auditLabel}>COMPLETE LOCATION</Text>
              <Text style={styles.addressLine}>
                {property.location?.address || 'Street address pending'}
              </Text>
              <Text style={styles.cityLine}>
                {[
                  property.location?.city,
                  property.location?.state,
                  property.location?.pincode ? `PIN: ${property.location.pincode}` : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Key Amenities */}
            <View style={styles.auditBlock}>
              <Text style={styles.auditLabel}>
                AMENITIES ({property.amenities?.length || 0})
              </Text>
              <View style={styles.amenitiesTags}>
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.map((a) => (
                    <View key={a.id || a.name} style={styles.amenityTag}>
                      <Feather name="check" size={11} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={styles.amenityTagName}>{a.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noneText}>No amenities selected</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Gallery Stats */}
            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>ATTACHED PHOTOS</Text>
              <Text style={styles.photoCountText}>
                {property.images?.length || 0} high-res architectural images
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons Bar */}
      <View style={styles.actionsFooter}>
        <View style={styles.footerNote}>
          <Feather name="shield" size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            Administrator changes will be immediately committed to the Cityspace operational catalog.
          </Text>
        </View>

        <View style={styles.buttonsGroup}>
          {onSaveDraft && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onSaveDraft}
              disabled={isSubmitting}
              style={styles.saveDraftBtn}
            >
              <Feather name="file-text" size={15} color="#334155" style={{ marginRight: 6 }} />
              <Text style={styles.saveDraftBtnText}>Save Draft</Text>
            </TouchableOpacity>
          )}

          {onPublish && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPublish}
              disabled={isSubmitting}
              style={styles.publishBtn}
            >
              <Feather name="check-circle" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.publishBtnText}>
                {mode === 'edit' ? 'Update & Publish' : 'Publish Property'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  previewHeader: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: BorderRadius.md,
    padding: 16,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.8,
  },
  previewSubtext: {
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  cardContainer: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
  },
  detailsContainer: {
    flex: 1,
    minWidth: 320,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  publicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 240,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  floatingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedFloatingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  featuredFloating: {
    backgroundColor: '#D97706',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    ...Shadows.sm,
  },
  listingBadgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 10,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLocationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 14,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  auditBlock: {
    gap: 6,
  },
  auditLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  addressLine: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cityLine: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  amenitiesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  amenityTagName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  noneText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  photoCountText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  actionsFooter: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 260,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  saveDraftBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#059669',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
