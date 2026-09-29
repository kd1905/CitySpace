import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { propertyVisitService, PropertyVisit, VisitStatus } from '@/services/propertyVisitService';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_approval: { label: 'Pending Approval', color: '#D97706', bg: '#FEF3C7', icon: 'clock' },
  approved: { label: 'Confirmed', color: '#059669', bg: '#D1FAE5', icon: 'check-circle' },
  rejected: { label: 'Not Approved', color: '#DC2626', bg: '#FEE2E2', icon: 'x-circle' },
  rescheduled: { label: 'Rescheduled', color: '#2563EB', bg: '#DBEAFE', icon: 'refresh-cw' },
  completed: { label: 'Completed', color: '#065F46', bg: '#A7F3D0', icon: 'check-square' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F1F5F9', icon: 'slash' },
  no_show: { label: 'No Show', color: '#EA580C', bg: '#FFEDD5', icon: 'alert-triangle' },
  scheduled: { label: 'Scheduled', color: '#0284C7', bg: '#E0F2FE', icon: 'calendar' },
};

const FILTER_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending_approval', label: 'Pending' },
  { id: 'approved', label: 'Upcoming' },
  { id: 'rescheduled', label: 'Rescheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B', bg: '#F1F5F9', icon: 'circle' };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Feather name={meta.icon as any} size={11} color={meta.color} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function MyVisitsScreen() {
  const [phone, setPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSearch = useCallback(async () => {
    const cleanPhone = phoneInput.trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) return;

    setLoading(true);
    setSearched(false);
    try {
      const list = await propertyVisitService.getAll({ userPhone: cleanPhone });
      setVisits(list);
      setPhone(cleanPhone);
      setSearched(true);
    } catch (err) {
      console.warn('[MyVisits] search error:', err);
    } finally {
      setLoading(false);
    }
  }, [phoneInput]);

  const filtered = visits.filter((v) => activeFilter === 'all' || v.status === activeFilter);

  const getDisplayDate = (v: PropertyVisit) => {
    if ((v.status === 'approved' || v.status === 'rescheduled') && v.confirmedDate) {
      return { date: v.confirmedDate, time: v.confirmedTime, confirmed: true };
    }
    return { date: v.visitDate, time: v.visitTime, confirmed: false };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="calendar" size={24} color="#6366F1" />
        </View>
        <View>
          <Text style={styles.headerTitle}>My Property Visits</Text>
          <Text style={styles.headerSub}>Track your scheduled site visits</Text>
        </View>
      </View>

      {/* Phone Lookup */}
      <View style={styles.lookupCard}>
        <Text style={styles.lookupTitle}>Look Up Your Visits</Text>
        <Text style={styles.lookupSub}>
          Enter the phone number you used when contacting an agent to see your scheduled visits.
        </Text>
        <View style={styles.lookupRow}>
          <View style={styles.lookupInput}>
            <Feather name="phone" size={15} color="#94A3B8" />
            <TextInput
              style={styles.phoneInput}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder="+91 9000000000"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchBtnText}>Find Visits</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {searched && (
        <>
          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              const count = tab.id === 'all'
                ? visits.length
                : visits.filter((v) => v.status === tab.id).length;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveFilter(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                      <Text style={[styles.filterCountText, isActive && { color: '#fff' }]}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {visits.length === 0 ? 'No visits found' : `No ${activeFilter.replace(/_/g, ' ')} visits`}
              </Text>
              <Text style={styles.emptySub}>
                {visits.length === 0
                  ? `No property visits found for ${phone}. Please check the phone number or contact your agent.`
                  : 'Try a different filter tab above.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 14 }}>
              <Text style={styles.resultsInfo}>{filtered.length} visit{filtered.length !== 1 ? 's' : ''} found for {phone}</Text>
              {filtered.map((visit) => {
                const slot = getDisplayDate(visit);
                return (
                  <View key={visit.id} style={styles.visitCard}>
                    {/* Property */}
                    <View style={styles.visitCardHeader}>
                      {visit.propertyImage ? (
                        <Image source={{ uri: visit.propertyImage }} style={styles.propImage} />
                      ) : (
                        <View style={styles.propImagePlaceholder}>
                          <Feather name="home" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.propInfo}>
                        <Text style={styles.propTitle} numberOfLines={2}>{visit.propertyTitle}</Text>
                        <Text style={styles.propLocation}>{visit.propertyCity}</Text>
                      </View>
                      <StatusBadge status={visit.status} />
                    </View>

                    <View style={styles.divider} />

                    {/* Date/Time */}
                    <View style={styles.slotRow}>
                      <Feather
                        name="calendar"
                        size={14}
                        color={slot.confirmed ? '#059669' : '#64748B'}
                      />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.slotLabel}>
                          {slot.confirmed ? '✓ Confirmed Date & Time' : 'Requested Date & Time'}
                        </Text>
                        <Text style={[styles.slotValue, slot.confirmed && { color: '#059669' }]}>
                          {slot.date} at {slot.time}
                        </Text>
                      </View>
                    </View>

                    {/* Agent */}
                    {visit.agentName && (
                      <View style={styles.slotRow}>
                        <Feather name="user-check" size={14} color="#64748B" />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.slotLabel}>Your Agent</Text>
                          <Text style={styles.slotValue}>{visit.agentName}</Text>
                          {visit.agentPhone && (
                            <Text style={styles.agentPhone}>{visit.agentPhone}</Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Rejection reason */}
                    {visit.status === 'rejected' && !!visit.rejectionReason && (
                      <View style={styles.reasonBox}>
                        <Feather name="info" size={13} color="#DC2626" />
                        <Text style={styles.reasonText}>Reason: {visit.rejectionReason}</Text>
                      </View>
                    )}

                    {/* Reschedule reason */}
                    {visit.status === 'rescheduled' && !!visit.rescheduleReason && (
                      <View style={[styles.reasonBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <Feather name="info" size={13} color="#2563EB" />
                        <Text style={[styles.reasonText, { color: '#2563EB' }]}>
                          Rescheduled: {visit.rescheduleReason}
                        </Text>
                      </View>
                    )}

                    {/* Notes */}
                    {!!visit.notes && (
                      <Text style={styles.notesText} numberOfLines={2}>📝 {visit.notes}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {!searched && !loading && (
        <View style={styles.intro}>
          <View style={styles.introCard}>
            <Feather name="map-pin" size={28} color="#6366F1" />
            <Text style={styles.introTitle}>Track Your Property Visits</Text>
            <Text style={styles.introText}>
              Enter your registered phone number above to see all your scheduled property visits, their status, and the agent details.
            </Text>
            <View style={styles.statusGuide}>
              {Object.entries(STATUS_META).slice(0, 5).map(([key, meta]) => (
                <View key={key} style={styles.statusGuideItem}>
                  <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                  <Text style={styles.statusGuideText}>{meta.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  lookupCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  lookupTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  lookupSub: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 16 },
  lookupRow: { flexDirection: 'row', gap: 10 },
  lookupInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  searchBtn: {
    backgroundColor: '#6366F1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4, maxHeight: 46 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: { backgroundColor: '#6366F1' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#fff' },
  filterCount: {
    marginLeft: 5, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  list: { flex: 1 },
  resultsInfo: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    padding: 16,
    ...Shadows.card,
  },
  visitCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  propImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F1F5F9' },
  propImagePlaceholder: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  propInfo: { flex: 1 },
  propTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  propLocation: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  slotRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  slotLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  slotValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  agentPhone: { fontSize: 12, color: '#6366F1', marginTop: 2 },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  reasonText: { fontSize: 12, color: '#DC2626', flex: 1, lineHeight: 18 },
  notesText: { fontSize: 12, color: '#64748B', marginTop: 8, fontStyle: 'italic' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  intro: { flex: 1, padding: 16 },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  introTitle: {
    fontSize: 18, fontWeight: '800', color: '#0F172A',
    marginTop: 14, marginBottom: 8, textAlign: 'center',
  },
  introText: {
    fontSize: 14, color: '#64748B', lineHeight: 22,
    textAlign: 'center', marginBottom: 20,
  },
  statusGuide: { width: '100%', gap: 8 },
  statusGuideItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusGuideText: { fontSize: 13, color: '#334155', fontWeight: '500' },
});
