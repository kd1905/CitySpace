import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { propertyService } from '@/services/propertyService';
import { Property, PropertyStatus } from '@/types/property';
import { FilterBar, FilterState } from '@/components/admin/FilterBar';
import { PropertyTable } from '@/components/admin/PropertyTable';
import { PropertyStatusBadge } from '@/components/admin/PropertyStatusBadge';
import { formatCurrency, formatArea } from '@/utils/formatters';

const INITIAL_FILTERS: FilterState = {
  search: '',
  status: 'all',
  category: 'all',
  listingType: 'all',
  city: 'All',
  featured: 'all',
  verified: 'all',
};

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export type PropertyTabKey = 'all' | 'published' | 'drafts' | 'pending_approval' | 'featured' | 'sold_rented';

export default function AdminPropertiesScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ status?: string; search?: string }>();
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
    search: searchParams.search || '',
  }));
  const [activeTab, setActiveTab] = useState<PropertyTabKey>(() => {
    if (searchParams.status === 'published') return 'published';
    if (searchParams.status === 'draft') return 'drafts';
    if (searchParams.status === 'pending_approval') return 'pending_approval';
    if (searchParams.status === 'featured') return 'featured';
    return 'all';
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [viewProperty, setViewProperty] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    propertyService.refreshFromBackend().then(() => {
      setRefreshKey((k) => k + 1);
    });
  }, []);

  const allAdminProperties = useMemo(() => {
    return propertyService.getAllAdmin();
  }, [refreshKey]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allAdminProperties.length,
      published: allAdminProperties.filter((p) => p.status === 'published').length,
      drafts: allAdminProperties.filter((p) => p.status === 'draft').length,
      pending_approval: allAdminProperties.filter(
        (p) => p.status === 'pending_approval' || p.verificationStatus === 'submitted' || p.verificationStatus === 'under_review'
      ).length,
      featured: allAdminProperties.filter((p) => p.featured).length,
      sold_rented: allAdminProperties.filter((p) => p.status === 'sold' || p.status === 'rented').length,
    };
  }, [allAdminProperties]);

  // Apply all filter parameters & tab selection
  const filteredProperties = useMemo(() => {
    return allAdminProperties.filter((p) => {
      // Tab filter
      if (activeTab === 'published' && p.status !== 'published') return false;
      if (activeTab === 'drafts' && p.status !== 'draft') return false;
      if (activeTab === 'pending_approval' && !(p.status === 'pending_approval' || p.verificationStatus === 'submitted' || p.verificationStatus === 'under_review')) return false;
      if (activeTab === 'featured' && !p.featured) return false;
      if (activeTab === 'sold_rented' && !(p.status === 'sold' || p.status === 'rented')) return false;

      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCity = p.location.city.toLowerCase().includes(q);
        const matchAddress = p.location.address.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchAddress && !matchId) {
          return false;
        }
      }

      // Status
      if (filters.status !== 'all' && p.status !== filters.status) {
        return false;
      }

      // Category / Type
      if (filters.category !== 'all') {
        const catLower = filters.category.toLowerCase();
        const matchCat =
          p.category.toLowerCase() === catLower ||
          p.categoryLabel.toLowerCase().includes(catLower);
        if (!matchCat) return false;
      }

      // Listing Type (Buy / Rent)
      if (filters.listingType !== 'all' && p.type !== filters.listingType) {
        return false;
      }

      // Location / City
      if (
        filters.city !== 'All' &&
        p.location.city.toLowerCase() !== filters.city.toLowerCase()
      ) {
        return false;
      }

      // Featured
      if (filters.featured !== 'all' && p.featured !== filters.featured) {
        return false;
      }

      // Verified
      if (filters.verified !== 'all' && p.verified !== filters.verified) {
        return false;
      }

      return true;
    });
  }, [allAdminProperties, filters, activeTab]);

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProperties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProperties.map((p) => p.id));
    }
  };

  const handleBulkPublish = async () => {
    await propertyService.bulkUpdateStatus(selectedIds, 'published');
    showToast(`Published ${selectedIds.length} properties.`, 'success');
    setSelectedIds([]);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkUnpublish = async () => {
    await propertyService.bulkUpdateStatus(selectedIds, 'draft');
    showToast(`Moved ${selectedIds.length} properties to Drafts.`, 'info');
    setSelectedIds([]);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkDelete = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected properties?`)) {
        return;
      }
    }
    await propertyService.bulkDelete(selectedIds);
    showToast(`Deleted ${selectedIds.length} properties permanently.`, 'error');
    setSelectedIds([]);
    setRefreshKey((k) => k + 1);
  };

  // Duplicate handler
  const handleDuplicate = async (property: Property) => {
    const duplicated = await propertyService.duplicateProperty(property.id);
    if (duplicated) {
      showToast(`Property duplicated as "${duplicated.title}".`, 'success');
      setRefreshKey((k) => k + 1);
    } else {
      showToast('Failed to duplicate property.', 'error');
    }
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // 1. View action -> Open in-app Quick View Modal
  const handleView = (property: Property) => {
    setViewProperty(property);
  };

  // 2. Edit action -> Navigate to Edit Property page
  const handleEdit = (property: Property) => {
    router.push({
      pathname: '/admin/edit-property',
      params: { id: property.id },
    } as any);
  };

  // 3. Delete action -> Trigger custom confirmation dialog
  const handleDelete = (property: Property) => {
    setDeleteTarget(property);
  };

  const confirmDeleteAction = () => {
    if (!deleteTarget) return;
    propertyService.deleteProperty(deleteTarget.id);
    showToast(`Property "${deleteTarget.title}" permanently deleted.`, 'error');
    if (viewProperty?.id === deleteTarget.id) {
      setViewProperty(null);
    }
    setDeleteTarget(null);
    setRefreshKey((k) => k + 1);
  };

  // 4. Publish / Unpublish / Relist toggle
  const handleTogglePublish = (property: Property) => {
    let nextStatus: PropertyStatus;
    let msg: string;

    if (property.status === 'published') {
      nextStatus = 'unpublished';
      msg = `Listing "${property.title}" unpublished from catalog.`;
    } else if (property.status === 'sold' || property.status === 'rented') {
      nextStatus = 'published';
      msg = `Listing "${property.title}" re-listed as Published.`;
    } else {
      nextStatus = 'published';
      msg = `Listing "${property.title}" is now Published live!`;
    }

    propertyService.setPublishStatus(property.id, nextStatus);
    showToast(msg, 'success');

    if (viewProperty?.id === property.id) {
      setViewProperty({ ...viewProperty, status: nextStatus });
    }
    setRefreshKey((k) => k + 1);
  };

  // 5. Toggle Verified
  const handleToggleVerified = (property: Property) => {
    propertyService.toggleVerified(property.id);
    const nextVerified = !property.verified;
    showToast(
      nextVerified
        ? `"${property.title}" is now Verified with blue check 🛡️`
        : `Verification badge removed for "${property.title}".`,
      'info'
    );

    if (viewProperty?.id === property.id) {
      setViewProperty({ ...viewProperty, verified: nextVerified });
    }
    setRefreshKey((k) => k + 1);
  };

  // 6. Toggle Featured
  const handleToggleFeatured = (property: Property) => {
    propertyService.toggleFeatured(property.id);
    const nextFeatured = !property.featured;
    showToast(
      nextFeatured
        ? `"${property.title}" marked as Featured listing ⭐`
        : `Removed "${property.title}" from Featured listings.`,
      'info'
    );

    if (viewProperty?.id === property.id) {
      setViewProperty({ ...viewProperty, featured: nextFeatured });
    }
    setRefreshKey((k) => k + 1);
  };

  // 7. Mark Sold / Mark Available (Buy properties)
  const handleMarkSold = (property: Property) => {
    if (property.status === 'sold') {
      propertyService.setPublishStatus(property.id, 'published');
      showToast(`Listing "${property.title}" marked Available (Published).`, 'success');
      if (viewProperty?.id === property.id) {
        setViewProperty({ ...viewProperty, status: 'published' });
      }
    } else {
      propertyService.markSold(property.id);
      showToast(`Listing "${property.title}" marked as Sold.`, 'warning');
      if (viewProperty?.id === property.id) {
        setViewProperty({ ...viewProperty, status: 'sold' });
      }
    }
    setRefreshKey((k) => k + 1);
  };

  // 8. Mark Rented / Mark Available (Rent properties)
  const handleMarkRented = (property: Property) => {
    if (property.status === 'rented') {
      propertyService.setPublishStatus(property.id, 'published');
      showToast(`Listing "${property.title}" marked Available (Published).`, 'success');
      if (viewProperty?.id === property.id) {
        setViewProperty({ ...viewProperty, status: 'published' });
      }
    } else {
      propertyService.markRented(property.id);
      showToast(`Listing "${property.title}" marked as Rented.`, 'warning');
      if (viewProperty?.id === property.id) {
        setViewProperty({ ...viewProperty, status: 'rented' });
      }
    }
    setRefreshKey((k) => k + 1);
  };

  const openPublicPage = (id: string) => {
    if (Platform.OS === 'web') {
      window.open(`/properties/${id}`, '_blank');
    } else {
      router.push(`/properties/${id}` as any);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Top Section with Title, Stats & Actions */}
        <View style={styles.topSection}>
          <View style={styles.titleCol}>
            <Text style={styles.pageTitle}>Properties</Text>
            <Text style={styles.pageSubtitle}>
              Manage entire property catalog, adjust pricing, publish listings, mark sold/rented, and audit verifications.
            </Text>
          </View>

          <View style={styles.topActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/admin/add-property')}
              style={styles.addPropertyBtn}
            >
              <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addPropertyBtnText}>+ Add Property</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Tabs Bar & View Toggle */}
        <View style={styles.tabsAndToggleRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {(
              [
                { key: 'all', label: 'All', count: tabCounts.all },
                { key: 'published', label: 'Published', count: tabCounts.published },
                { key: 'drafts', label: 'Drafts', count: tabCounts.drafts },
                { key: 'pending_approval', label: 'Pending Approval', count: tabCounts.pending_approval },
                { key: 'featured', label: 'Featured', count: tabCounts.featured },
                { key: 'sold_rented', label: 'Sold / Rented', count: tabCounts.sold_rented },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Table / Grid Mode Toggle */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              onPress={() => setViewMode('table')}
              style={[styles.viewToggleBtn, viewMode === 'table' && styles.viewToggleBtnActive]}
            >
              <Feather name="list" size={15} color={viewMode === 'table' ? '#0F172A' : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
            >
              <Feather name="grid" size={15} color={viewMode === 'grid' ? '#0F172A' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Bar with Search, Status, Type, Buy/Rent, Location, Featured, Verified */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
          totalResults={filteredProperties.length}
        />

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <View style={styles.bulkActionBar}>
            <View style={styles.bulkActionInfo}>
              <Feather name="check-square" size={16} color="#0F172A" />
              <Text style={styles.bulkActionTitle}>{selectedIds.length} properties selected</Text>
            </View>
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity onPress={handleBulkPublish} style={styles.bulkBtnSuccess}>
                <Feather name="globe" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.bulkBtnTextWhite}>Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkUnpublish} style={styles.bulkBtnWarning}>
                <Feather name="file-text" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.bulkBtnTextWhite}>Set Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkDelete} style={styles.bulkBtnDanger}>
                <Feather name="trash-2" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.bulkBtnTextWhite}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedIds([])} style={styles.bulkBtnClear}>
                <Text style={styles.bulkBtnTextClear}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Property Listings (Table or Grid View) */}
        {viewMode === 'table' ? (
          <PropertyTable
            properties={filteredProperties}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            onToggleVerified={handleToggleVerified}
            onToggleFeatured={handleToggleFeatured}
            onMarkSold={handleMarkSold}
            onMarkRented={handleMarkRented}
            onDuplicate={handleDuplicate}
            emptyMessage="No properties match the selected filters. Try broadening your criteria or search query."
          />
        ) : (
          <View style={styles.propertyGrid}>
            {filteredProperties.length === 0 ? (
              <View style={styles.gridEmptyBox}>
                <Feather name="inbox" size={40} color="#CBD5E1" />
                <Text style={styles.gridEmptyTitle}>No Properties Found</Text>
                <Text style={styles.gridEmptySub}>No properties match your current filters.</Text>
              </View>
            ) : (
              filteredProperties.map((p) => {
                const cover = p.images && p.images.length > 0 ? p.images[0] : null;
                const isSelected = selectedIds.includes(p.id);
                return (
                  <View key={p.id} style={[styles.gridCard, isSelected && styles.gridCardSelected]}>
                    <View style={styles.gridCardImageWrapper}>
                      {cover ? (
                        <Image source={{ uri: cover }} style={styles.gridCardImage} />
                      ) : (
                        <View style={[styles.gridCardImage, styles.gridCardImagePlaceholder]}>
                          <Feather name="image" size={32} color="#CBD5E1" />
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleToggleSelect(p.id)}
                        style={[styles.gridSelectCheck, isSelected && styles.gridSelectCheckActive]}
                      >
                        <Feather name={isSelected ? 'check' : 'circle'} size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
                      </TouchableOpacity>
                      <View style={styles.gridCardStatusBadge}>
                        <PropertyStatusBadge status={p.status} verified={p.verified} featured={p.featured} size="sm" />
                      </View>
                    </View>

                    <View style={styles.gridCardContent}>
                      <View style={styles.gridCardPriceRow}>
                        <Text style={styles.gridCardPrice}>
                          {formatCurrency(p.price, p.currency)}
                          {p.type === 'rent' && <Text style={styles.gridRentUnit}>/mo</Text>}
                        </Text>
                        <Text style={styles.gridCardCategory}>{p.categoryLabel || p.category}</Text>
                      </View>

                      <Text style={styles.gridCardTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.gridCardLocation} numberOfLines={1}>
                        <Feather name="map-pin" size={11} color="#64748B" /> {p.location.address || p.location.city}
                      </Text>

                      <View style={styles.gridCardSpecs}>
                        <Text style={styles.gridSpecText}>{p.specs.bedrooms} BHK</Text>
                        <Text style={styles.gridSpecDot}>•</Text>
                        <Text style={styles.gridSpecText}>{p.specs.bathrooms} Baths</Text>
                        <Text style={styles.gridSpecDot}>•</Text>
                        <Text style={styles.gridSpecText}>{formatArea(p.specs.areaSqFt)}</Text>
                      </View>

                      <View style={styles.gridCardActions}>
                        <TouchableOpacity onPress={() => handleView(p)} style={styles.gridActionBtn}>
                          <Feather name="eye" size={13} color="#0284C7" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEdit(p)} style={styles.gridActionBtn}>
                          <Feather name="edit-2" size={13} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDuplicate(p)} style={styles.gridActionBtn}>
                          <Feather name="copy" size={13} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleTogglePublish(p)} style={styles.gridActionBtn}>
                          <Feather name={p.status === 'published' ? 'eye-off' : 'globe'} size={13} color={p.status === 'published' ? '#D97706' : '#059669'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(p)} style={[styles.gridActionBtn, { backgroundColor: '#FEE2E2' }]}>
                          <Feather name="trash-2" size={13} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Toast Notification */}
      {toast && (
        <View
          style={[
            styles.toastContainer,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'info' && styles.toastInfo,
            toast.type === 'warning' && styles.toastWarning,
            toast.type === 'error' && styles.toastError,
          ]}
        >
          <Feather
            name={
              toast.type === 'success'
                ? 'check-circle'
                : toast.type === 'error'
                ? 'x-circle'
                : toast.type === 'warning'
                ? 'alert-triangle'
                : 'info'
            }
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity
            onPress={() => setToast(null)}
            style={{ marginLeft: 12, padding: 2 }}
          >
            <Feather name="x" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setDeleteTarget(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModalCard}>
              <View style={styles.deleteModalIconBox}>
                <Feather name="trash-2" size={24} color="#DC2626" />
              </View>

              <Text style={styles.deleteModalTitle}>Delete Property Listing?</Text>
              <Text style={styles.deleteModalDesc}>
                Are you sure you want to permanently delete{' '}
                <Text style={styles.deleteModalHighlight}>"{deleteTarget.title}"</Text> (ID: {deleteTarget.id})? This listing will be immediately removed from the catalog.
              </Text>

              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeleteTarget(null)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={confirmDeleteAction}
                  style={styles.confirmDeleteBtn}
                >
                  <Feather name="trash-2" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmDeleteBtnText}>Delete Permanently</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Quick View Details Modal */}
      {viewProperty && (
        <Modal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setViewProperty(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.quickViewCard}>
              {/* Modal Header */}
              <View style={styles.quickViewHeader}>
                <View style={styles.quickViewTitleGroup}>
                  <Text style={styles.quickViewHeading} numberOfLines={1}>
                    {viewProperty.title}
                  </Text>
                  <Text style={styles.quickViewId}>ID: {viewProperty.id}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setViewProperty(null)}
                  style={styles.closeModalBtn}
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Modal Scrollable Content */}
              <ScrollView
                style={styles.quickViewBody}
                contentContainerStyle={{ padding: 20, gap: 16 }}
                showsVerticalScrollIndicator={true}
              >
                {/* Image Banner with Badges */}
                <View style={styles.quickViewImageContainer}>
                  {viewProperty.images && viewProperty.images.length > 0 ? (
                    <Image
                      source={{ uri: viewProperty.images[0] }}
                      style={styles.quickViewImage}
                    />
                  ) : (
                    <View style={[styles.quickViewImage, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                      <Feather name="image" size={32} color="#94A3B8" />
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>No image available</Text>
                    </View>
                  )}
                  <View style={styles.quickViewImageBadges}>
                    <PropertyStatusBadge
                      status={viewProperty.status}
                      verified={viewProperty.verified}
                      featured={viewProperty.featured}
                      size="sm"
                    />
                  </View>
                </View>

                {/* Price & Location */}
                <View style={styles.quickViewPriceRow}>
                  <View>
                    <Text style={styles.quickViewPrice}>
                      {formatCurrency(viewProperty.price, viewProperty.currency, viewProperty.type)}
                    </Text>
                    <Text style={styles.quickViewType}>
                      {viewProperty.type.toUpperCase()} • {viewProperty.categoryLabel || viewProperty.category}
                    </Text>
                  </View>

                  <View style={styles.quickViewLocationBox}>
                    <Feather name="map-pin" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                    <Text style={styles.quickViewLocationText}>
                      {viewProperty.location.neighborhood}, {viewProperty.location.city}
                    </Text>
                  </View>
                </View>

                {/* Specifications Grid */}
                <View style={styles.quickViewSpecsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Bedrooms</Text>
                    <Text style={styles.specValue}>{viewProperty.specs.bedrooms} BHK</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Bathrooms</Text>
                    <Text style={styles.specValue}>{viewProperty.specs.bathrooms}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Carpet Area</Text>
                    <Text style={styles.specValue}>{formatArea(viewProperty.specs.areaSqFt)}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Furnishing</Text>
                    <Text style={styles.specValue} numberOfLines={1}>
                      {viewProperty.specs.furnishing || 'Unfurnished'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {viewProperty.description && (
                  <View style={styles.quickViewSection}>
                    <Text style={styles.quickViewSectionTitle}>Description</Text>
                    <Text style={styles.quickViewDescText}>
                      {viewProperty.description}
                    </Text>
                  </View>
                )}

                {/* Agent Assignment */}
                {viewProperty.agent && (
                  <View style={styles.quickViewAgentRow}>
                    <Image
                      source={{ uri: viewProperty.agent.avatar }}
                      style={styles.quickViewAgentAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickViewAgentName}>{viewProperty.agent.name}</Text>
                      <Text style={styles.quickViewAgentRole}>{viewProperty.agent.phone}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer with Active Quick Controls */}
              <View style={styles.quickViewFooter}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTogglePublish(viewProperty)}
                  style={[
                    styles.footerActionBtn,
                    viewProperty.status === 'published'
                      ? styles.footerUnpublishBtn
                      : styles.footerPublishBtn,
                  ]}
                >
                  <Feather
                    name={
                      viewProperty.status === 'published'
                        ? 'eye-off'
                        : viewProperty.status === 'sold' || viewProperty.status === 'rented'
                        ? 'refresh-cw'
                        : 'upload-cloud'
                    }
                    size={14}
                    color={
                      viewProperty.status === 'published'
                        ? '#D97706'
                        : viewProperty.status === 'sold' || viewProperty.status === 'rented'
                        ? '#0284C7'
                        : '#059669'
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.footerActionBtnText,
                      {
                        color:
                          viewProperty.status === 'published'
                            ? '#D97706'
                            : viewProperty.status === 'sold' || viewProperty.status === 'rented'
                            ? '#0284C7'
                            : '#059669',
                      },
                    ]}
                  >
                    {viewProperty.status === 'published'
                      ? 'Unpublish'
                      : viewProperty.status === 'sold' || viewProperty.status === 'rented'
                      ? 'Re-list'
                      : 'Publish'}
                  </Text>
                </TouchableOpacity>

                {/* Buy: Mark Sold / Available */}
                {viewProperty.type === 'buy' && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleMarkSold(viewProperty)}
                    style={[
                      styles.footerActionBtn,
                      viewProperty.status === 'sold'
                        ? styles.footerAvailableBtn
                        : styles.footerSoldBtn,
                    ]}
                  >
                    <Feather
                      name={viewProperty.status === 'sold' ? 'check-circle' : 'check-square'}
                      size={14}
                      color={viewProperty.status === 'sold' ? '#059669' : '#DC2626'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.footerActionBtnText,
                        { color: viewProperty.status === 'sold' ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {viewProperty.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Rent: Mark Rented / Available */}
                {viewProperty.type === 'rent' && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleMarkRented(viewProperty)}
                    style={[
                      styles.footerActionBtn,
                      viewProperty.status === 'rented'
                        ? styles.footerAvailableBtn
                        : styles.footerRentedBtn,
                    ]}
                  >
                    <Feather
                      name={viewProperty.status === 'rented' ? 'check-circle' : 'key'}
                      size={14}
                      color={viewProperty.status === 'rented' ? '#059669' : '#D97706'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.footerActionBtnText,
                        { color: viewProperty.status === 'rented' ? '#059669' : '#D97706' },
                      ]}
                    >
                      {viewProperty.status === 'rented' ? 'Mark Available' : 'Mark Rented'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Toggle Featured */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleToggleFeatured(viewProperty)}
                  style={[
                    styles.footerActionBtn,
                    viewProperty.featured && styles.footerFeaturedActive,
                  ]}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={viewProperty.featured ? '#D97706' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.footerActionBtnText,
                      { color: viewProperty.featured ? '#D97706' : '#475569' },
                    ]}
                  >
                    {viewProperty.featured ? 'Featured' : 'Feature'}
                  </Text>
                </TouchableOpacity>

                {/* Toggle Verified */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleToggleVerified(viewProperty)}
                  style={[
                    styles.footerActionBtn,
                    viewProperty.verified && styles.footerVerifiedActive,
                  ]}
                >
                  <Feather
                    name={viewProperty.verified ? 'check-circle' : 'circle'}
                    size={14}
                    color={viewProperty.verified ? '#0284C7' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.footerActionBtnText,
                      { color: viewProperty.verified ? '#0284C7' : '#475569' },
                    ]}
                  >
                    {viewProperty.verified ? 'Verified' : 'Verify'}
                  </Text>
                </TouchableOpacity>

                {/* Edit Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setViewProperty(null);
                    handleEdit(viewProperty);
                  }}
                  style={styles.footerEditBtn}
                >
                  <Feather name="edit-2" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.footerEditBtnText}>Edit</Text>
                </TouchableOpacity>

                {/* Open Public Page */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => openPublicPage(viewProperty.id)}
                  style={styles.footerPublicLinkBtn}
                  {...Platform.select({ web: { title: 'Open live public page in new tab' } as any })}
                >
                  <Feather name="external-link" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.footerPublicLinkText}>Public Site</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
    width: '100%',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  titleCol: {
    flex: 1,
    minWidth: 260,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 600,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  resetDemoBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  addPropertyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  addPropertyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Toast Notification
  toastContainer: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 420,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastInfo: {
    backgroundColor: '#0284C7',
  },
  toastWarning: {
    backgroundColor: '#D97706',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999,
  },

  // Delete Modal
  deleteModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    ...Shadows.card,
  },
  deleteModalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  deleteModalDesc: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteModalHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmDeleteBtn: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quick View Modal
  quickViewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Shadows.card,
  },
  quickViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quickViewTitleGroup: {
    flex: 1,
    marginRight: 12,
  },
  quickViewHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickViewId: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  quickViewBody: {
    flex: 1,
  },
  quickViewImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  quickViewImage: {
    width: '100%',
    height: '100%',
  },
  quickViewImageBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  quickViewPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickViewPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  quickViewType: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  quickViewLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickViewLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  quickViewSpecsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  specBox: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  specLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
  quickViewSection: {
    gap: 6,
  },
  quickViewSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickViewDescText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  quickViewAgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  quickViewAgentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  quickViewAgentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickViewAgentRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  quickViewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  footerActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerPublishBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  footerUnpublishBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  footerSoldBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  footerRentedBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  footerAvailableBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  footerFeaturedActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  footerVerifiedActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  footerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    marginLeft: 'auto',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  footerEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerPublicLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  footerPublicLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  tabsAndToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  tabsScroll: {
    flex: 1,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabBadgeActive: {
    backgroundColor: '#334155',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexWrap: 'wrap',
    gap: 12,
  },
  bulkActionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  bulkBtnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  bulkBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  bulkBtnClear: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  bulkBtnTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bulkBtnTextClear: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridEmptyBox: {
    width: '100%',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  gridEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  gridEmptySub: {
    fontSize: 13,
    color: '#64748B',
  },
  gridCard: {
    width: 320,
    flexGrow: 1,
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.card,
  },
  gridCardSelected: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  gridCardImageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridSelectCheck: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  gridSelectCheckActive: {
    backgroundColor: '#2563EB',
  },
  gridCardStatusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  gridCardContent: {
    padding: 14,
    gap: 6,
  },
  gridCardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridRentUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  gridCardCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  gridCardLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  gridCardSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 4,
    gap: 6,
  },
  gridSpecText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  gridSpecDot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  gridCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  gridActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
});
