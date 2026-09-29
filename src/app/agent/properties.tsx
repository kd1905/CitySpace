import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { propertyService } from '@/services/propertyService';
import { Property, PropertyStatus } from '@/types/property';
import { formatCurrency, formatArea } from '@/utils/formatters';

export default function AgentPropertiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | PropertyStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      await propertyService.refreshFromBackend();
      const all = propertyService.getAllAdmin();
      // Filter only properties assigned to this agent
      const assigned = all.filter(
        (p) => p.assignedAgentId === agentId || (p.agent && p.agent.id === agentId)
      );
      setProperties(assigned);
    } catch (err) {
      console.warn('[AgentProperties] Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadProperties();
    const interval = setInterval(loadProperties, 15000);
    return () => clearInterval(interval);
  }, [loadProperties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.neighborhood.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [properties, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = properties.length;
    const published = properties.filter((p) => p.status === 'published').length;
    const forSale = properties.filter((p) => p.type === 'buy').length;
    const forRent = properties.filter((p) => p.type === 'rent').length;
    const totalVal = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    return { total, published, forSale, forRent, totalVal };
  }, [properties]);

  const handleCopyLink = (property: Property) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cityspace.in';
    const url = `${origin}/properties/${property.id}?ref=${agentId}`;
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(url);
      setCopiedId(property.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleOpenMap = (property: Property) => {
    const query = encodeURIComponent(
      `${property.title}, ${property.location.neighborhood}, ${property.location.city}`
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleShareWhatsApp = (property: Property) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cityspace.in';
    const url = `${origin}/properties/${property.id}?ref=${agentId}`;
    const text = encodeURIComponent(
      `Check out this verified listing on Cityspace:\n*${property.title}*\nLocation: ${property.location.neighborhood}, ${property.location.city}\nPrice: ${formatCurrency(property.price, property.currency, property.type)}\n\nExplore brochure: ${url}`
    );
    const waUrl = `https://wa.me/?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(waUrl, '_blank');
    } else {
      Linking.openURL(waUrl);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT PORTAL / INVENTORY</Text>
          <Text style={styles.title}>My Assigned Properties</Text>
          <Text style={styles.subtitle}>
            Properties exclusively assigned to your advisory desk across your assigned territories.
          </Text>
        </View>

        <TouchableOpacity onPress={loadProperties} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.refreshBtnText}>Sync Listings</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{stats.total}</Text>
          <Text style={styles.metricLbl}>Total Assigned</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: '#059669' }]}>{stats.published}</Text>
          <Text style={styles.metricLbl}>Active / Published</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: '#0284C7' }]}>{stats.forSale}</Text>
          <Text style={styles.metricLbl}>For Sale</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: '#7C3AED' }]}>{stats.forRent}</Text>
          <Text style={styles.metricLbl}>For Rent</Text>
        </View>
      </View>

      {/* Filter Tabs & Search */}
      <View style={styles.filterSection}>
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'sold', label: 'Sold' },
            { id: 'rented', label: 'Rented' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setStatusFilter(tab.id as any)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by title, neighborhood, city, or type..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading assigned listings...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="home" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Properties Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? `No assigned properties match "${searchQuery}".`
              : 'You currently have no properties assigned to your advisory desk in this category. Properties assigned by the central administrator will appear here automatically.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredProperties.map((property) => (
            <View key={property.id} style={styles.propertyCard}>
              <View style={styles.imageBox}>
                {property.images && property.images.length > 0 ? (
                  <Image source={{ uri: property.images[0] }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.noImage]}>
                    <Feather name="image" size={32} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      property.status === 'published' && styles.badgePublished,
                      property.status === 'sold' && styles.badgeSold,
                      property.status === 'rented' && styles.badgeRented,
                      property.status === 'draft' && styles.badgeDraft,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{property.status.toUpperCase()}</Text>
                  </View>

                  {property.verified && (
                    <View style={styles.verifiedBadge}>
                      <Feather name="check-circle" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {formatCurrency(property.price, property.currency, property.type)}
                  </Text>
                  <Text style={styles.categoryBadge}>{property.categoryLabel}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {property.title}
                </Text>

                <View style={styles.locRow}>
                  <Feather name="map-pin" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.locText} numberOfLines={1}>
                    {property.location.neighborhood}, {property.location.city}
                  </Text>
                </View>

                <View style={styles.specsRow}>
                  <View style={styles.specItem}>
                    <Feather name="maximize-2" size={12} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.specVal}>{formatArea(property.specs.areaSqFt)}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Feather name="disc" size={12} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.specVal}>{property.specs.bedrooms} BHK</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Feather name="droplet" size={12} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.specVal}>{property.specs.bathrooms} Baths</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => router.push(`/properties/${property.id}` as any)}
                    style={styles.viewDetailsBtn}
                  >
                    <Feather name="external-link" size={13} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={styles.viewDetailsText}>View Page</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleCopyLink(property)}
                    style={[styles.actionIconBtn, copiedId === property.id && styles.actionIconBtnCopied]}
                  >
                    <Feather
                      name={copiedId === property.id ? 'check' : 'copy'}
                      size={13}
                      color={copiedId === property.id ? '#059669' : '#475569'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareWhatsApp(property)}
                    style={styles.actionIconBtn}
                  >
                    <Feather name="share-2" size={13} color="#059669" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleOpenMap(property)}
                    style={styles.actionIconBtn}
                  >
                    <Feather name="map" size={13} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitles: {
    gap: 4,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#0284C7',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 4,
    ...Shadows.sm,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  propertyCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageBox: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  badgePublished: {
    backgroundColor: '#059669',
  },
  badgeSold: {
    backgroundColor: '#DC2626',
  },
  badgeRented: {
    backgroundColor: '#7C3AED',
  },
  badgeDraft: {
    backgroundColor: '#D97706',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnCopied: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
});
