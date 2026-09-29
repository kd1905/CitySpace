import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types/property';
import { formatCurrency, formatArea } from '@/utils/formatters';
import { PropertyStatusBadge } from '@/components/admin/PropertyStatusBadge';

export default function PropertyVerificationDesk() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'under_review' | 'verified' | 'rejected'>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Review form state
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [checklist, setChecklist] = useState({
    titleDeed: true,
    encumbranceCert: false,
    physicalInspection: true,
    locationAccuracy: true,
    mediaQuality: true,
    pricingReasonable: true,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProperties = async () => {
    const list = await propertyService.refreshFromBackend();
    setProperties(list);
  };

  useEffect(() => {
    loadProperties();
  }, [refreshKey]);

  const stats = useMemo(() => {
    return {
      all: properties.length,
      pending: properties.filter((p) => p.verificationStatus === 'submitted' || (!p.verified && p.status === 'draft')).length,
      underReview: properties.filter((p) => p.verificationStatus === 'under_review').length,
      verified: properties.filter((p) => p.verified || p.verificationStatus === 'verified').length,
      rejected: properties.filter((p) => p.verificationStatus === 'rejected').length,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (activeFilter === 'pending') {
        return p.verificationStatus === 'submitted' || (!p.verified && p.status === 'draft');
      }
      if (activeFilter === 'under_review') {
        return p.verificationStatus === 'under_review';
      }
      if (activeFilter === 'verified') {
        return p.verified || p.verificationStatus === 'verified';
      }
      if (activeFilter === 'rejected') {
        return p.verificationStatus === 'rejected';
      }
      return true;
    });
  }, [properties, activeFilter]);

  const openReviewModal = (prop: Property) => {
    setSelectedProperty(prop);
    setNotes(prop.verificationNotes || '');
    setRejectionReason(prop.rejectionReason || '');
    setChecklist({
      titleDeed: prop.verified || prop.verificationStatus === 'verified',
      encumbranceCert: prop.verified || prop.verificationStatus === 'verified',
      physicalInspection: prop.verified || prop.verificationStatus === 'verified',
      locationAccuracy: true,
      mediaQuality: Boolean(prop.images && prop.images.length >= 3),
      pricingReasonable: true,
    });
  };

  const handleApprove = async () => {
    if (!selectedProperty) return;
    await propertyService.updateVerification(selectedProperty.id, 'verified', notes);
    showToast(`Property "${selectedProperty.title}" successfully Verified & Published!`);
    setSelectedProperty(null);
    setRefreshKey((k) => k + 1);
  };

  const handleUnderReview = async () => {
    if (!selectedProperty) return;
    await propertyService.updateVerification(selectedProperty.id, 'under_review', notes);
    showToast(`Property "${selectedProperty.title}" marked Under Review.`);
    setSelectedProperty(null);
    setRefreshKey((k) => k + 1);
  };

  const handleReject = async () => {
    if (!selectedProperty) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason before rejecting.');
      return;
    }
    await propertyService.updateVerification(selectedProperty.id, 'rejected', notes, rejectionReason);
    showToast(`Property "${selectedProperty.title}" marked as Rejected.`);
    setSelectedProperty(null);
    setRefreshKey((k) => k + 1);
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>Property Verification Desk</Text>
            <Text style={styles.pageSubtitle}>
              Audit title deeds, inspect physical assets, check media quality, and verify Cityspace listings.
            </Text>
          </View>
        </View>

        {/* Verification Summary Counts */}
        <View style={styles.statsRow}>
          {(
            [
              { key: 'all', label: 'All Listings', count: stats.all, color: '#0F172A', icon: 'layers' },
              { key: 'pending', label: 'Pending Review', count: stats.pending, color: '#D97706', icon: 'clock' },
              { key: 'under_review', label: 'Under Review', count: stats.underReview, color: '#2563EB', icon: 'eye' },
              { key: 'verified', label: 'Verified', count: stats.verified, color: '#059669', icon: 'check-circle' },
              { key: 'rejected', label: 'Rejected', count: stats.rejected, color: '#DC2626', icon: 'x-circle' },
            ] as const
          ).map((s) => {
            const isActive = activeFilter === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => setActiveFilter(s.key)}
                style={[styles.statCard, isActive && styles.statCardActive]}
              >
                <View style={styles.statTop}>
                  <Text style={[styles.statLabel, isActive && styles.statLabelActive]}>{s.label}</Text>
                  <Feather name={s.icon as any} size={15} color={isActive ? '#FFFFFF' : s.color} />
                </View>
                <Text style={[styles.statCount, isActive && styles.statCountActive]}>{s.count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Verification Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeading}>Verification Queue</Text>
            <Text style={styles.tableSub}>{filteredProperties.length} listings in this view</Text>
          </View>

          {filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="shield" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Properties Found</Text>
              <Text style={styles.emptySub}>There are no listings matching the selected verification filter.</Text>
            </View>
          ) : (
            filteredProperties.map((prop) => {
              const cover = prop.images && prop.images.length > 0 ? prop.images[0] : null;
              const vStatus = prop.verificationStatus || (prop.verified ? 'verified' : 'draft');
              return (
                <View key={prop.id} style={styles.tableRow}>
                  <View style={styles.rowThumbnailWrapper}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.rowThumbnail} />
                    ) : (
                      <View style={[styles.rowThumbnail, styles.rowThumbnailPlaceholder]}>
                        <Feather name="image" size={18} color="#94A3B8" />
                      </View>
                    )}
                  </View>

                  <View style={styles.rowInfoCol}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{prop.title}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {prop.location.address || prop.location.city} • {prop.specs.bedrooms} BHK • {formatArea(prop.specs.areaSqFt)}
                    </Text>
                    <Text style={styles.rowPrice}>
                      {formatCurrency(prop.price, prop.currency)}
                      {prop.type === 'rent' && ' /mo'}
                    </Text>
                  </View>

                  <View style={styles.rowBadgeCol}>
                    <View style={[
                      styles.vBadge,
                      vStatus === 'verified' && styles.vBadgeVerified,
                      vStatus === 'under_review' && styles.vBadgeReview,
                      vStatus === 'rejected' && styles.vBadgeRejected,
                      (vStatus === 'submitted' || vStatus === 'draft') && styles.vBadgePending,
                    ]}>
                      <Text style={[
                        styles.vBadgeText,
                        vStatus === 'verified' && styles.vBadgeTextVerified,
                        vStatus === 'under_review' && styles.vBadgeTextReview,
                        vStatus === 'rejected' && styles.vBadgeTextRejected,
                        (vStatus === 'submitted' || vStatus === 'draft') && styles.vBadgeTextPending,
                      ]}>
                        {vStatus.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    {prop.verificationNotes ? (
                      <Text style={styles.rowNotesSnippet} numberOfLines={1}>
                        Note: {prop.verificationNotes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.rowActionCol}>
                    <TouchableOpacity
                      onPress={() => openReviewModal(prop)}
                      style={styles.reviewDeskBtn}
                    >
                      <Feather name="check-square" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                      <Text style={styles.reviewDeskBtnText}>Review & Inspect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      {selectedProperty && (
        <Modal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setSelectedProperty(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>Verification Review Desk</Text>
                  <Text style={styles.modalSub}>{selectedProperty.title} (ID: {selectedProperty.id})</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedProperty(null)} style={styles.closeBtn}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 18, padding: 20 }}>
                {/* Property Brief */}
                <View style={styles.briefCard}>
                  <View style={styles.briefImageCol}>
                    {selectedProperty.images && selectedProperty.images.length > 0 ? (
                      <Image source={{ uri: selectedProperty.images[0] }} style={styles.briefImage} />
                    ) : (
                      <View style={[styles.briefImage, styles.rowThumbnailPlaceholder]}>
                        <Feather name="image" size={24} color="#94A3B8" />
                      </View>
                    )}
                  </View>
                  <View style={styles.briefInfoCol}>
                    <Text style={styles.briefPrice}>{formatCurrency(selectedProperty.price, selectedProperty.currency)}</Text>
                    <Text style={styles.briefText}>{selectedProperty.specs.bedrooms} BHK • {selectedProperty.specs.bathrooms} Baths • {formatArea(selectedProperty.specs.areaSqFt)}</Text>
                    <Text style={styles.briefText}><Feather name="map-pin" size={11} color="#64748B" /> {selectedProperty.location.address}, {selectedProperty.location.city}</Text>
                    <Text style={styles.briefText}>Assigned Agent: {selectedProperty.agent?.name || 'Unassigned'}</Text>
                  </View>
                </View>

                {/* Audit Checklist */}
                <View style={styles.checklistSection}>
                  <Text style={styles.sectionTitle}>1. DOCUMENT & ASSET CHECKLIST</Text>
                  <View style={styles.checklistGrid}>
                    {[
                      { key: 'titleDeed', label: 'Title Deed & Encumbrance Verified' },
                      { key: 'encumbranceCert', label: 'Municipal Sanction & RERA Approved' },
                      { key: 'physicalInspection', label: 'Physical Site Verified by Agent' },
                      { key: 'locationAccuracy', label: 'Geo Coordinates & Society Matched' },
                      { key: 'mediaQuality', label: 'High-Resolution Photos (Min 3)' },
                      { key: 'pricingReasonable', label: 'Fair Market Price Validation' },
                    ].map((item) => {
                      const checked = checklist[item.key as keyof typeof checklist];
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => toggleChecklist(item.key as keyof typeof checklist)}
                          style={styles.checkItem}
                        >
                          <Feather
                            name={checked ? 'check-square' : 'square'}
                            size={16}
                            color={checked ? '#059669' : '#94A3B8'}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Reviewer Notes */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>2. REVIEWER AUDIT NOTES</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Enter inspection feedback, document IDs, or requirements for the agent..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                </View>

                {/* Rejection Reason (Required only if rejecting) */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>3. REJECTION REASON (IF REJECTING)</Text>
                  <TextInput
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    placeholder="Provide specific reason why verification cannot be completed..."
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={handleReject} style={styles.btnReject}>
                  <Feather name="x-octagon" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTextReject}>Reject Listing</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleUnderReview} style={styles.btnReview}>
                  <Feather name="clock" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTextReview}>Keep Under Review</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleApprove} style={styles.btnApprove}>
                  <Feather name="shield" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTextApprove}>Approve & Mark Verified</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  statCardActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statLabelActive: {
    color: '#94A3B8',
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  statCountActive: {
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.card,
  },
  tableHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
    flexWrap: 'wrap',
  },
  rowThumbnailWrapper: {
    width: 60,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  rowThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rowThumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfoCol: {
    flex: 1,
    minWidth: 220,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  rowBadgeCol: {
    width: 140,
    gap: 4,
  },
  vBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
  },
  vBadgeVerified: { backgroundColor: '#ECFDF5' },
  vBadgeReview: { backgroundColor: '#EFF6FF' },
  vBadgeRejected: { backgroundColor: '#FEF2F2' },
  vBadgePending: { backgroundColor: '#FFFBEB' },
  vBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  vBadgeTextVerified: { color: '#059669' },
  vBadgeTextReview: { color: '#2563EB' },
  vBadgeTextRejected: { color: '#DC2626' },
  vBadgeTextPending: { color: '#D97706' },
  rowNotesSnippet: {
    fontSize: 10.5,
    color: '#64748B',
  },
  rowActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  reviewDeskBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    flex: 1,
  },
  briefCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  briefImageCol: {
    width: 90,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
  },
  briefImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  briefInfoCol: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  briefPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  briefText: {
    fontSize: 11.5,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  checklistSection: {
    gap: 8,
  },
  checklistGrid: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  checkLabel: {
    fontSize: 13,
    color: '#475569',
  },
  checkLabelActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  formSection: {
    gap: 6,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
  } as any,
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0F172A',
    outlineStyle: 'none',
  } as any,
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnTextReject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnReview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnTextReview: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  btnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#059669',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnTextApprove: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
