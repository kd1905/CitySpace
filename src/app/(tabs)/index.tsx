import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Typography, PublicContentMaxWidth } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { Container } from '@/components/common/Container';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryCard } from '@/components/property/CategoryCard';
import { PropertyCard } from '@/components/property/PropertyCard';
import { LocationCard } from '@/components/location/LocationCard';
import { PropertyCategories, PropertyCategory } from '@/constants/categories';
import { PopularLocations, PopularCity } from '@/constants/locations';
import { propertyService } from '@/services/propertyService';
import { recentlyViewedService, RecentlyViewedItem } from '@/services/recentlyViewedService';
import { formatCurrency } from '@/utils/formatters';
import { Property } from '@/types/property';

export default function HomeScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(() =>
    recentlyViewedService.getRecent(6)
  );
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);

  useEffect(() => {
    propertyService.refreshFromBackend().then(() => {
      setDataVersion((v) => v + 1);
    });
    const unsubRecent = recentlyViewedService.subscribe(() => {
      setRecentlyViewed(recentlyViewedService.getRecent(6));
    });
    return () => unsubRecent();
  }, []);

  const allProperties: Property[] = useMemo(() => propertyService.getAll(), [dataVersion]);
  const featuredProperties: Property[] = useMemo(() => propertyService.getFeatured().slice(0, 4), [dataVersion]);
  const latestProperties: Property[] = useMemo(() => propertyService.getLatest().slice(0, 4), [dataVersion]);

  const getCityCount = (cityName: string) => {
    return allProperties.filter(
      (p) => p.location.city.toLowerCase() === cityName.toLowerCase()
    ).length;
  };

  const getCategoryCount = (catId: string) => {
    return allProperties.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      if (catId === 'apartments') return pCat === 'apartment';
      if (catId === 'houses') return pCat === 'house';
      if (catId === 'villas') return pCat === 'villa';
      if (catId === 'plots') return pCat === 'plots' || pCat === 'plot';
      if (catId === 'land') return pCat === 'land';
      if (catId === 'commercial') return pCat === 'commercial';
      return pCat === catId;
    }).length;
  };

  const handleCategoryPress = (category: PropertyCategory) => {
    setSelectedCategory(category.id);
    router.push({ pathname: '/properties', params: { category: category.id } } as any);
  };

  const handleLocationPress = (city: PopularCity) => {
    router.push({ pathname: '/properties', params: { city: city.name } } as any);
  };

  const whyFeatures = [
    { icon: 'shield', title: 'Verified properties', desc: 'Every listing reviewed for your peace of mind.' },
    { icon: 'map-pin', title: 'Accurate locations', desc: 'Real locations, real insights with map view.' },
    { icon: 'users', title: 'Trusted agents', desc: 'Connect with experienced real estate professionals.' },
    { icon: 'message-circle', title: 'Personal assistance', desc: 'Get expert guidance at every step.' },
  ];

  // Show 5 categories matching reference: Apartments, Houses, Villas, Plots & Land, Commercial
  const displayCategories = PropertyCategories.slice(0, 5);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 1. Hero Section with search form */}
        <HeroSection />

        {/* 2. Featured Properties: "Handpicked for you" */}
        <View style={styles.section}>
          <Container>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.sectionOverline}>FEATURED PROPERTIES</Text>
                <Text style={styles.sectionTitle}>Handpicked for you</Text>
                <Text style={styles.sectionSubtitle}>
                  Verified properties in prime locations across India.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/properties')}
                style={styles.viewAllLink}
              >
                <Text style={styles.viewAllText}>View all properties</Text>
                <Feather name="arrow-right" size={15} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {featuredProperties.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="star" size={32} color="#D97706" />
                <Text style={styles.emptyTitle}>No featured properties yet</Text>
                <Text style={styles.emptyDesc}>
                  Curated premium properties will appear here once featured.
                </Text>
              </View>
            ) : (
              <View style={[styles.propertyGrid, isDesktop ? styles.propertyGridDesktop : isTablet ? styles.propertyGridTablet : styles.propertyGridMobile]}>
                {featuredProperties.map((prop) => (
                  <View
                    key={prop.id}
                    style={{ width: isDesktop ? '24%' : isTablet ? '48%' : '100%', marginBottom: 16 }}
                  >
                    <PropertyCard property={prop} />
                  </View>
                ))}
              </View>
            )}
          </Container>
        </View>

        {/* 3. Explore by property type */}
        <View style={styles.sectionAlt}>
          <Container>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore by property type</Text>
              <Text style={styles.sectionSubtitle}>
                Find your ideal space from a wide range of property types.
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
              {displayCategories.map((cat) => (
                <View key={cat.id} style={styles.categoryItem}>
                  <CategoryCard
                    category={cat}
                    count={getCategoryCount(cat.id)}
                    selected={selectedCategory === cat.id}
                    onPress={() => handleCategoryPress(cat)}
                  />
                </View>
              ))}
            </ScrollView>
          </Container>
        </View>

        {/* 4. Popular Locations */}
        <View style={styles.section}>
          <Container>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.sectionTitle}>Popular locations</Text>
                <Text style={styles.sectionSubtitle}>
                  Explore properties in India's most sought-after cities.
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/properties' as any)} style={styles.viewAllLink}>
                <Text style={styles.viewAllText}>View all locations</Text>
                <Feather name="arrow-right" size={15} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationsRow}>
              {PopularLocations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  city={loc}
                  count={getCityCount(loc.name)}
                  onPress={() => handleLocationPress(loc)}
                />
              ))}
            </ScrollView>
          </Container>
        </View>

        {/* 5. Just Listed */}
        <View style={styles.sectionAlt}>
          <Container>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.sectionOverline}>NEW ADDITIONS</Text>
                <Text style={styles.sectionTitle}>Just listed</Text>
                <Text style={styles.sectionSubtitle}>Fresh spaces recently added to the catalog.</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/properties', params: { sort: 'newest' } } as any)}
                style={styles.viewAllLink}
              >
                <Text style={styles.viewAllText}>View all properties</Text>
                <Feather name="arrow-right" size={15} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {latestProperties.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="layers" size={32} color="#0284C7" />
                <Text style={styles.emptyTitle}>No properties currently listed</Text>
                <Text style={styles.emptyDesc}>New properties added by administrators will appear here.</Text>
              </View>
            ) : (
              <View style={[styles.propertyGrid, isDesktop ? styles.propertyGridDesktop : isTablet ? styles.propertyGridTablet : styles.propertyGridMobile]}>
                {latestProperties.map((prop) => (
                  <View
                    key={prop.id}
                    style={{ width: isDesktop ? '24%' : isTablet ? '48%' : '100%', marginBottom: 16 }}
                  >
                    <PropertyCard property={prop} />
                  </View>
                ))}
              </View>
            )}
          </Container>
        </View>

        {/* 6. Recently Viewed (shown only after user has browsed) */}
        {recentlyViewed.length > 0 && (
          <View style={styles.section}>
            <Container>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headerLeftCol}>
                  <Text style={styles.sectionOverline}>BROWSING HISTORY</Text>
                  <Text style={styles.sectionTitle}>Recently Viewed</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.viewAllLink}>
                  <Text style={styles.viewAllText}>View all</Text>
                  <Feather name="arrow-right" size={15} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {recentlyViewed.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recentCard}
                    activeOpacity={0.88}
                    onPress={() => router.push(`/properties/${item.id}` as any)}
                  >
                    {item.images[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.recentCardImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.recentCardImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' }]}>
                        <Feather name="image" size={20} color="#94A3B8" />
                      </View>
                    )}
                    <View style={styles.recentCardBody}>
                      <Text style={styles.recentCardTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.recentCardPrice}>{formatCurrency(item.price, item.currency, item.type)}</Text>
                      <Text style={styles.recentCardLoc} numberOfLines={1}>{item.location.neighborhood}, {item.location.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Container>
          </View>
        )}

        {/* 7. Why Cityspace */}
        <View style={styles.whySection}>
          <Container>
            <View style={[styles.whyInner, isDesktop && styles.whyInnerDesktop]}>
              {/* Left: features */}
              <View style={[styles.whyLeft, isDesktop && styles.whyLeftDesktop]}>
                <Text style={styles.whyHeading}>Why choose Cityspace?</Text>
                <Text style={styles.whySubheading}>A smarter way to discover, buy or rent your next space.</Text>
                <View style={[styles.whyGrid, isDesktop ? styles.whyGridDesktop : styles.whyGridMobile]}>
                  {whyFeatures.map((feat) => (
                    <View key={feat.title} style={[styles.whyCard, { width: isDesktop ? '47%' : isTablet ? '47%' : '100%' }]}>
                      <View style={styles.whyIconCircle}>
                        <Feather name={feat.icon as any} size={20} color="#2563EB" />
                      </View>
                      <Text style={styles.whyCardTitle}>{feat.title}</Text>
                      <Text style={styles.whyCardDesc}>{feat.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Right: CTA card */}
              {isDesktop && (
                <View style={styles.whyCtaCard}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80' }}
                    style={styles.whyCtaImg}
                    resizeMode="cover"
                  />
                  <View style={styles.whyCtaOverlay} />
                  <View style={styles.whyCtaContent}>
                    <Text style={styles.whyCtaTitle}>Your next{'\n'}chapter starts here.</Text>
                    <Text style={styles.whyCtaSub}>Explore a world of possibilities with Cityspace.</Text>
                    <TouchableOpacity onPress={() => router.push('/properties')} style={styles.whyCtaBtn} activeOpacity={0.88}>
                      <Text style={styles.whyCtaBtnText}>Explore Properties</Text>
                      <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Container>
        </View>

        {/* 8. Footer */}
        <View style={styles.footerSection}>
          <Container>
            <View style={styles.footerGrid}>
              {/* Brand Column */}
              <View style={styles.footerBrandCol}>
                <View style={styles.footerBrandRow}>
                  <View style={styles.footerBadge}>
                    <Text style={styles.footerBadgeText}>C</Text>
                  </View>
                  <Text style={styles.footerBrandTitle}>CITYSPACE</Text>
                </View>
                <Text style={styles.footerTagline}>"Your next space starts here."</Text>
                <Text style={styles.footerMission}>
                  A curated real estate marketplace dedicated to verified homes, plots, and commercial properties across India's vibrant urban corridors.
                </Text>
                <View style={styles.socialRow}>
                  {(['instagram', 'linkedin', 'youtube'] as const).map((icon) => (
                    <TouchableOpacity key={icon} style={styles.socialBtn}>
                      <Feather name={icon as any} size={16} color="#475569" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Properties Column */}
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Properties</Text>
                {[
                  ['Buy', '/properties?type=buy'],
                  ['Rent', '/properties?type=rent'],
                  ['Commercial', '/properties?category=commercial'],
                  ['Plots & Land', '/properties?category=plots'],
                  ['Featured', '/properties'],
                ].map(([label, path]) => (
                  <TouchableOpacity key={label} onPress={() => router.push(path as any)} style={styles.footerLink}>
                    <Text style={styles.footerLinkText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Company Column */}
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Company</Text>
                {[
                  ['About Cityspace', '/contact'],
                  ['Our Agents', '/agents'],
                  ['Careers', '/contact'],
                  ['Contact', '/contact'],
                  ['Sell with Cityspace', '/sell'],
                ].map(([label, path]) => (
                  <TouchableOpacity key={label} onPress={() => router.push(path as any)} style={styles.footerLink}>
                    <Text style={styles.footerLinkText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Support Column */}
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>Support</Text>
                {[
                  ['FAQs', '/contact'],
                  ['Privacy Policy', '/contact'],
                  ['Terms', '/contact'],
                  ['Sitemap', '/properties'],
                  ['Help Center', '/contact'],
                ].map(([label, path]) => (
                  <TouchableOpacity key={label} onPress={() => router.push(path as any)} style={styles.footerLink}>
                    <Text style={styles.footerLinkText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Newsletter Column */}
              <View style={styles.footerNewsletterCol}>
                <Text style={styles.footerColTitle}>Subscribe to updates</Text>
                <Text style={styles.footerNewsletterSub}>Get the latest properties and offers.</Text>
                <View style={styles.newsletterRow}>
                  <TextInput
                    style={styles.newsletterInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    value={newsletterEmail}
                    onChangeText={setNewsletterEmail}
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={styles.newsletterBtn}
                    onPress={() => {
                      if (newsletterEmail && newsletterConsent) {
                        setNewsletterEmail('');
                        if (Platform.OS === 'web') window.alert('Subscribed! Thank you.');
                      }
                    }}
                  >
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setNewsletterConsent((v) => !v)} style={styles.consentRow}>
                  <View style={[styles.checkbox, newsletterConsent && styles.checkboxChecked]}>
                    {newsletterConsent && <Feather name="check" size={10} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.consentText}>I agree to receive updates from Cityspace.</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.footerBottomRow}>
              <Text style={styles.footerCopyright}>© 2026 Cityspace. All rights reserved.</Text>
              <Text style={styles.footerRight}>Spaces for a better tomorrow.</Text>
            </View>
          </Container>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  section: { paddingVertical: 52, backgroundColor: '#FFFFFF' },
  sectionAlt: { paddingVertical: 52, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E8ECEF' },
  sectionHeader: { marginBottom: 28 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  headerLeftCol: { maxWidth: 600 },

  sectionOverline: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, color: '#E07B25', marginBottom: 4 },
  sectionTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 21 },

  viewAllLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  propertyGridDesktop: { gap: 16 },
  propertyGridTablet: { gap: 14 },
  propertyGridMobile: { gap: 14 },

  categoriesRow: { gap: 14, paddingVertical: 8 },
  categoryItem: { width: 180 },

  locationsRow: { gap: 16, paddingVertical: 8 },

  // Recently viewed
  recentCard: { width: 190, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  recentCardImg: { width: '100%', height: 110, backgroundColor: '#E2E8F0' },
  recentCardBody: { padding: 12, gap: 3 },
  recentCardTitle: { fontSize: 12, fontWeight: '700', color: '#0F172A', lineHeight: 17 },
  recentCardPrice: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  recentCardLoc: { fontSize: 10, color: '#64748B' },

  // Empty state
  emptyState: { padding: 48, alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 400 },

  // Why section
  whySection: { paddingVertical: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0' },
  whyInner: { gap: 24 },
  whyInnerDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 40 },
  whyLeft: { flex: 1 },
  whyLeftDesktop: { flex: 1.4 },
  whyHeading: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4, marginBottom: 6 },
  whySubheading: { fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 21 },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  whyGridDesktop: {},
  whyGridMobile: {},
  whyCard: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  whyIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  whyCardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  whyCardDesc: { fontSize: 13, color: '#64748B', lineHeight: 19 },

  // Why CTA card
  whyCtaCard: { width: 300, height: 380, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: '#0F172A' },
  whyCtaImg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  whyCtaOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,18,35,0.55)' },
  whyCtaContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 },
  whyCtaTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', lineHeight: 28, marginBottom: 8 },
  whyCtaSub: { fontSize: 13, color: '#CBD5E1', lineHeight: 19, marginBottom: 16 },
  whyCtaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  whyCtaBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Footer
  footerSection: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 56, paddingBottom: 32 },
  footerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 28, marginBottom: 40 },
  footerBrandCol: { flex: 1.4, minWidth: 220, gap: 10 },
  footerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  footerBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  footerBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  footerBrandTitle: { fontSize: 17, fontWeight: '900', letterSpacing: 2, color: '#0F172A' },
  footerTagline: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  footerMission: { fontSize: 13, lineHeight: 20, color: '#64748B', maxWidth: 300 },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  socialBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  footerCol: { flex: 1, minWidth: 120, gap: 8 },
  footerColTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  footerLink: { paddingVertical: 2, ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  footerLinkText: { fontSize: 13, color: '#64748B', ...Platform.select({ web: { ':hover': { color: '#0F172A' } } as any }) },
  footerNewsletterCol: { flex: 1.2, minWidth: 220, gap: 8 },
  footerNewsletterSub: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  newsletterRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#F8FAFC' },
  newsletterInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A', outlineStyle: 'none' } as any,
  newsletterBtn: { backgroundColor: '#0F172A', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxChecked: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  consentText: { fontSize: 11, color: '#64748B', flex: 1, lineHeight: 16 },
  footerBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20, flexWrap: 'wrap', gap: 8 },
  footerCopyright: { fontSize: 12, color: '#94A3B8' },
  footerRight: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
});
