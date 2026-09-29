import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Property, PropertyStatus } from '@/types/property';
import { formatCurrency } from '@/utils/formatters';
import { useResponsive } from '@/hooks/useResponsive';
import { PropertyStatusBadge } from './PropertyStatusBadge';

interface PropertyTableProps {
  properties: Property[];
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onTogglePublish?: (property: Property) => void;
  onToggleVerified?: (property: Property) => void;
  onToggleFeatured?: (property: Property) => void;
  onMarkSold?: (property: Property) => void;
  onMarkRented?: (property: Property) => void;
  onDuplicate?: (property: Property) => void;
  emptyMessage?: string;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  properties,
  onView,
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleVerified,
  onToggleFeatured,
  onMarkSold,
  onMarkRented,
  onDuplicate,
  emptyMessage = 'No properties found matching your criteria.',
}) => {
  const { isDesktop } = useResponsive();

  const confirmDelete = (property: Property) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${property.title}"?`
      );
      if (confirmed) {
        onDelete(property);
      }
    } else {
      Alert.alert(
        'Delete Property',
        `Are you sure you want to permanently delete "${property.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(property),
          },
        ]
      );
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  if (properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={40} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Properties Found</Text>
        <Text style={styles.emptySubtitle}>{emptyMessage}</Text>
      </View>
    );
  }

  // Mobile / Tablet Card View
  if (!isDesktop) {
    return (
      <View style={styles.cardsContainer}>
        {properties.map((p) => {
          const cover = p.images && p.images.length > 0 ? p.images[0] : null;
          return (
            <View key={p.id} style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.mobileThumb} />
                ) : (
                  <View style={[styles.mobileThumb, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                    <Feather name="image" size={18} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.mobileHeaderInfo}>
                  <PropertyStatusBadge
                    status={p.status}
                    verified={p.verified}
                    featured={p.featured}
                    size="sm"
                  />
                  <Text style={styles.mobileTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.mobilePrice}>
                    {formatCurrency(p.price, p.currency, p.type)}
                  </Text>
                </View>
              </View>

              <View style={styles.mobileDetailsRow}>
                <View style={styles.mobileDetailItem}>
                  <Feather name="map-pin" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.mobileDetailText} numberOfLines={1}>
                    {p.location.neighborhood}, {p.location.city}
                  </Text>
                </View>
                <View style={styles.mobileDetailItem}>
                  <Text style={styles.mobileDetailType}>
                    {p.type.toUpperCase()} • {p.categoryLabel || p.category}
                  </Text>
                </View>
              </View>

              {/* Mobile Actions */}
              <View style={styles.mobileActionsRow}>
                <TouchableOpacity
                  onPress={() => onView(p)}
                  style={styles.mobileActionBtn}
                >
                  <Feather name="eye" size={14} color="#0284C7" style={{ marginRight: 4 }} />
                  <Text style={[styles.mobileActionText, { color: '#0284C7' }]}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onEdit(p)}
                  style={styles.mobileActionBtn}
                >
                  <Feather name="edit-2" size={14} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={styles.mobileActionText}>Edit</Text>
                </TouchableOpacity>

                {onTogglePublish && (
                  <TouchableOpacity
                    onPress={() => onTogglePublish(p)}
                    style={[
                      styles.mobileActionBtn,
                      p.status === 'published' ? styles.unpublishBtn : styles.publishBtn,
                    ]}
                  >
                    <Feather
                      name={
                        p.status === 'published'
                          ? 'eye-off'
                          : p.status === 'sold' || p.status === 'rented'
                          ? 'refresh-cw'
                          : 'upload-cloud'
                      }
                      size={14}
                      color={
                        p.status === 'published'
                          ? '#D97706'
                          : p.status === 'sold' || p.status === 'rented'
                          ? '#0284C7'
                          : '#059669'
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.mobileActionText,
                        {
                          color:
                            p.status === 'published'
                              ? '#D97706'
                              : p.status === 'sold' || p.status === 'rented'
                              ? '#0284C7'
                              : '#059669',
                        },
                      ]}
                    >
                      {p.status === 'published'
                        ? 'Unpublish'
                        : p.status === 'sold' || p.status === 'rented'
                        ? 'Re-list'
                        : 'Publish'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Buy: Sold or Undo Sold */}
                {p.type === 'buy' && onMarkSold && (
                  <TouchableOpacity
                    onPress={() => onMarkSold(p)}
                    style={[
                      styles.mobileActionBtn,
                      p.status === 'sold' ? styles.availableBtn : styles.soldBtn,
                    ]}
                  >
                    <Feather
                      name={p.status === 'sold' ? 'check-circle' : 'check-square'}
                      size={13}
                      color={p.status === 'sold' ? '#059669' : '#DC2626'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.mobileActionText,
                        { color: p.status === 'sold' ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {p.status === 'sold' ? 'Available' : 'Sold'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Rent: Rented or Undo Rented */}
                {p.type === 'rent' && onMarkRented && (
                  <TouchableOpacity
                    onPress={() => onMarkRented(p)}
                    style={[
                      styles.mobileActionBtn,
                      p.status === 'rented' ? styles.availableBtn : styles.rentedBtn,
                    ]}
                  >
                    <Feather
                      name={p.status === 'rented' ? 'check-circle' : 'key'}
                      size={13}
                      color={p.status === 'rented' ? '#059669' : '#D97706'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.mobileActionText,
                        { color: p.status === 'rented' ? '#059669' : '#D97706' },
                      ]}
                    >
                      {p.status === 'rented' ? 'Available' : 'Rented'}
                    </Text>
                  </TouchableOpacity>
                )}

                {onDuplicate && (
                  <TouchableOpacity
                    onPress={() => onDuplicate(p)}
                    style={styles.mobileActionBtn}
                  >
                    <Feather name="copy" size={13} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.mobileActionText}>Copy</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => confirmDelete(p)}
                  style={[styles.mobileActionBtn, styles.deleteActionBtn]}
                >
                  <Feather name="trash-2" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // Desktop Responsive Table
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={styles.tableScroll}
      contentContainerStyle={styles.tableScrollContent}
    >
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={[styles.thCell, styles.colProperty]}>
            <Text style={styles.th}>PROPERTY</Text>
          </View>
          <View style={[styles.thCell, styles.colLocation]}>
            <Text style={styles.th}>LOCATION</Text>
          </View>
          <View style={[styles.thCell, styles.colType]}>
            <Text style={styles.th}>TYPE</Text>
          </View>
          <View style={[styles.thCell, styles.colPrice]}>
            <Text style={styles.th}>PRICE</Text>
          </View>
          <View style={[styles.thCell, styles.colStatus]}>
            <Text style={styles.th}>STATUS</Text>
          </View>
          <View style={[styles.thCell, styles.colFeatured, styles.centerCell]}>
            <Text style={[styles.th, styles.textCenter]}>FEATURED</Text>
          </View>
          <View style={[styles.thCell, styles.colVerified, styles.centerCell]}>
            <Text style={[styles.th, styles.textCenter]}>VERIFIED</Text>
          </View>
          <View style={[styles.thCell, styles.colDate]}>
            <Text style={styles.th}>DATE</Text>
          </View>
          <View style={[styles.thCell, styles.colActions, styles.rightCell]}>
            <Text style={[styles.th, styles.textRight]}>ACTIONS</Text>
          </View>
        </View>

      {properties.map((p, index) => {
        const cover = p.images && p.images.length > 0 ? p.images[0] : null;
        const isEven = index % 2 === 0;

        return (
          <View
            key={p.id}
            style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
          >
            {/* Property Column */}
            <View style={[styles.td, styles.colProperty, styles.propertyCell]}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.tableThumb} />
              ) : (
                <View style={[styles.tableThumb, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="image" size={16} color="#94A3B8" />
                </View>
              )}
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={styles.propertyId} numberOfLines={1}>
                  ID: {p.id}
                </Text>
              </View>
            </View>

            {/* Location Column */}
            <View style={[styles.td, styles.colLocation]}>
              <Text style={styles.locationCity} numberOfLines={1}>
                {p.location.city}
              </Text>
              <Text style={styles.locationSub} numberOfLines={1}>
                {p.location.neighborhood || p.location.address}
              </Text>
            </View>

            {/* Type Column */}
            <View style={[styles.td, styles.colType]}>
              <View
                style={[
                  styles.listingTypeBadge,
                  p.type === 'buy' ? styles.buyBadge : styles.rentBadge,
                ]}
              >
                <Text
                  style={p.type === 'buy' ? styles.buyText : styles.rentText}
                >
                  {p.type === 'buy' ? 'Buy' : 'Rent'}
                </Text>
              </View>
              <Text style={styles.categorySub} numberOfLines={1}>
                {p.categoryLabel || p.category}
              </Text>
            </View>

            {/* Price Column */}
            <View style={[styles.td, styles.colPrice]}>
              <Text style={styles.priceText}>
                {formatCurrency(p.price, p.currency, p.type)}
              </Text>
            </View>

            {/* Status Column */}
            <View style={[styles.td, styles.colStatus]}>
              <PropertyStatusBadge status={p.status} size="sm" />
            </View>

            {/* Featured Column */}
            <View style={[styles.td, styles.colFeatured, styles.centerCell]}>
              {onToggleFeatured ? (
                <TouchableOpacity
                  onPress={() => onToggleFeatured(p)}
                  style={[
                    styles.toggleIconBtn,
                    p.featured && styles.toggleIconBtnActive,
                  ]}
                  {...Platform.select({
                    web: {
                      title: p.featured ? 'Featured (Click to Unfeature)' : 'Mark as Featured',
                    } as any,
                  })}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={p.featured ? '#D97706' : '#94A3B8'}
                  />
                </TouchableOpacity>
              ) : (
                <Feather
                  name="star"
                  size={14}
                  color={p.featured ? '#D97706' : '#CBD5E1'}
                />
              )}
            </View>

            {/* Verified Column */}
            <View style={[styles.td, styles.colVerified, styles.centerCell]}>
              {onToggleVerified ? (
                <TouchableOpacity
                  onPress={() => onToggleVerified(p)}
                  style={[
                    styles.toggleIconBtn,
                    p.verified && styles.toggleIconBtnVerified,
                  ]}
                  {...Platform.select({
                    web: {
                      title: p.verified ? 'Verified (Click to Revoke)' : 'Mark as Verified',
                    } as any,
                  })}
                >
                  <Feather
                    name={p.verified ? 'check-circle' : 'circle'}
                    size={14}
                    color={p.verified ? '#0284C7' : '#94A3B8'}
                  />
                </TouchableOpacity>
              ) : (
                <Feather
                  name={p.verified ? 'check-circle' : 'circle'}
                  size={14}
                  color={p.verified ? '#0284C7' : '#CBD5E1'}
                />
              )}
            </View>

            {/* Date Column */}
            <View style={[styles.td, styles.colDate]}>
              <Text style={styles.dateText}>{formatDate(p.createdAt)}</Text>
            </View>

            {/* Actions Column */}
            <View style={[styles.td, styles.colActions, styles.actionsCell]}>
              {/* View */}
              <TouchableOpacity
                onPress={() => onView(p)}
                style={styles.actionIconBtn}
                {...Platform.select({
                  web: { title: 'Quick View Details' } as any,
                })}
              >
                <Feather name="eye" size={14} color="#0284C7" />
              </TouchableOpacity>

              {/* Edit */}
              <TouchableOpacity
                onPress={() => onEdit(p)}
                style={styles.actionIconBtn}
                {...Platform.select({
                  web: { title: 'Edit Property Listing' } as any,
                })}
              >
                <Feather name="edit-2" size={14} color="#475569" />
              </TouchableOpacity>

              {/* Publish / Unpublish / Relist */}
              {onTogglePublish && (
                <TouchableOpacity
                  onPress={() => onTogglePublish(p)}
                  style={[
                    styles.actionIconBtn,
                    p.status === 'published'
                      ? styles.unpublishBtn
                      : p.status === 'sold' || p.status === 'rented'
                      ? styles.relistBtn
                      : styles.publishBtn,
                  ]}
                  {...Platform.select({
                    web: {
                      title:
                        p.status === 'published'
                          ? 'Unpublish Listing'
                          : p.status === 'sold' || p.status === 'rented'
                          ? 'Re-list as Published'
                          : 'Publish Listing to Catalog',
                    } as any,
                  })}
                >
                  <Feather
                    name={
                      p.status === 'published'
                        ? 'eye-off'
                        : p.status === 'sold' || p.status === 'rented'
                        ? 'refresh-cw'
                        : 'upload-cloud'
                    }
                    size={14}
                    color={
                      p.status === 'published'
                        ? '#D97706'
                        : p.status === 'sold' || p.status === 'rented'
                        ? '#0284C7'
                        : '#059669'
                    }
                  />
                </TouchableOpacity>
              )}

              {/* Mark Sold (for Buy properties: toggle Sold / Available) */}
              {p.type === 'buy' && onMarkSold && (
                <TouchableOpacity
                  onPress={() => onMarkSold(p)}
                  style={[
                    styles.actionIconBtn,
                    p.status === 'sold' ? styles.availableBtn : styles.soldBtn,
                  ]}
                  {...Platform.select({
                    web: {
                      title:
                        p.status === 'sold'
                          ? 'Mark Available (Undo Sold)'
                          : 'Mark as Sold',
                    } as any,
                  })}
                >
                  <Feather
                    name={p.status === 'sold' ? 'check-circle' : 'check-square'}
                    size={14}
                    color={p.status === 'sold' ? '#059669' : '#DC2626'}
                  />
                </TouchableOpacity>
              )}

              {/* Mark Rented (for Rent properties: toggle Rented / Available) */}
              {p.type === 'rent' && onMarkRented && (
                <TouchableOpacity
                  onPress={() => onMarkRented(p)}
                  style={[
                    styles.actionIconBtn,
                    p.status === 'rented' ? styles.availableBtn : styles.rentedBtn,
                  ]}
                  {...Platform.select({
                    web: {
                      title:
                        p.status === 'rented'
                          ? 'Mark Available (Undo Rented)'
                          : 'Mark as Rented',
                    } as any,
                  })}
                >
                  <Feather
                    name={p.status === 'rented' ? 'check-circle' : 'key'}
                    size={14}
                    color={p.status === 'rented' ? '#059669' : '#D97706'}
                  />
                </TouchableOpacity>
              )}

              {/* Duplicate */}
              {onDuplicate && (
                <TouchableOpacity
                  onPress={() => onDuplicate(p)}
                  style={styles.actionIconBtn}
                  {...Platform.select({
                    web: { title: 'Duplicate Listing' } as any,
                  })}
                >
                  <Feather name="copy" size={14} color="#475569" />
                </TouchableOpacity>
              )}

              {/* Delete */}
              <TouchableOpacity
                onPress={() => confirmDelete(p)}
                style={[styles.actionIconBtn, styles.deleteBtn]}
                {...Platform.select({
                  web: { title: 'Delete Property Permanently' } as any,
                })}
              >
                <Feather name="trash-2" size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tableScroll: {
    width: '100%',
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    minWidth: 1180,
    width: '100%',
    ...Shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns:
          'minmax(240px, 3fr) minmax(140px, 1.8fr) minmax(95px, 1.1fr) minmax(115px, 1.3fr) minmax(110px, 1.2fr) 76px 76px minmax(95px, 1.1fr) 210px',
        columnGap: 12,
        alignItems: 'center',
        boxSizing: 'border-box',
      } as any,
    }),
  },
  thCell: {
    justifyContent: 'center',
    minWidth: 0,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  centerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  rightCell: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  textCenter: {
    textAlign: 'center',
    width: '100%',
  },
  textRight: {
    textAlign: 'right',
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      web: {
        display: 'grid',
        gridTemplateColumns:
          'minmax(240px, 3fr) minmax(140px, 1.8fr) minmax(95px, 1.1fr) minmax(115px, 1.3fr) minmax(110px, 1.2fr) 76px 76px minmax(95px, 1.1fr) 210px',
        columnGap: 12,
        alignItems: 'center',
        boxSizing: 'border-box',
        transition: 'background-color 0.1s ease',
      } as any,
    }),
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#FAFCFF',
  },
  td: {
    justifyContent: 'center',
    minWidth: 0,
  },

  // Column Widths
  colProperty: {
    flex: 3,
    minWidth: 0,
  },
  colLocation: {
    flex: 1.8,
    minWidth: 0,
  },
  colType: {
    flex: 1.1,
    minWidth: 0,
  },
  colPrice: {
    flex: 1.3,
    minWidth: 0,
  },
  colStatus: {
    flex: 1.2,
    minWidth: 0,
  },
  colFeatured: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  colVerified: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  colDate: {
    flex: 1.1,
    minWidth: 0,
  },
  colActions: {
    width: 210,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 0,
  },

  // Property Cell
  propertyCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  propertyInfo: {
    flex: 1,
    minWidth: 0,
  },
  propertyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  propertyId: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Location Cell
  locationCity: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  locationSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Type Cell
  listingTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buyBadge: {
    backgroundColor: '#EFF6FF',
  },
  buyText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  rentBadge: {
    backgroundColor: '#F3E8FF',
  },
  rentText: {
    color: '#7E22CE',
    fontSize: 11,
    fontWeight: '700',
  },
  categorySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Price Cell
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Date Cell
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Actions Cell
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  unpublishBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  publishBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  relistBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  soldBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rentedBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  availableBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  toggleIconBtnActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  toggleIconBtnVerified: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },

  // Empty State
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // Mobile Cards Layout
  cardsContainer: {
    gap: 12,
  },
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    ...Shadows.sm,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  mobileThumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  mobileHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  mobileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mobilePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  mobileDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mobileDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileDetailText: {
    fontSize: 12,
    color: '#64748B',
  },
  mobileDetailType: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  mobileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mobileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
});
