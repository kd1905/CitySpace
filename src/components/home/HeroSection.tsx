import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { Container } from '@/components/common/Container';
import { BorderRadius } from '@/constants/layout';
import { FilterDropdown } from './FilterDropdown';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  screen: string;
  image: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Better Spaces\nBrighter Futures',
    subtitle: 'Modern homes for\na better tomorrow.',
    screen: '/properties',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 2,
    title: 'List & Sell\nYour Property',
    subtitle: 'Reach verified buyers\n& top city investors.',
    screen: '/sell',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 3,
    title: 'Meet Certified\nTop Agents',
    subtitle: 'Expert local brokers\nfor seamless deals.',
    screen: '/agents',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
  },
];

const POPULAR_SEARCHES = ['Pune', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Kolhapur', 'Navi Mumbai'];

const PROPERTY_TYPES = ['Any', 'Apartment', 'House', 'Villa', 'Plot', 'Commercial'];
const BUDGETS = ['Any', 'Under ₹30L', '₹30L–₹60L', '₹60L–₹1Cr', '₹1Cr–₹2Cr', 'Above ₹2Cr'];
const BHK_OPTIONS = ['Any', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

type DropdownType = 'propType' | 'budget' | 'bhk' | null;

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();

  const [activeType, setActiveType] = useState<'buy' | 'rent' | 'commercial'>('buy');
  const [location, setLocation] = useState('');
  const [propType, setPropType] = useState('Any');
  const [budget, setBudget] = useState('Any');
  const [bhk, setBhk] = useState('Any');
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [heroSlide, setHeroSlide] = useState(1);

  const currentSlide = HERO_SLIDES[heroSlide - 1] || HERO_SLIDES[0];

  const handleSearch = () => {
    setActiveDropdown(null);
    const params: Record<string, string> = {};

    if (activeType === 'commercial') {
      params.category = 'commercial';
    } else {
      params.type = activeType;
    }

    if (location.trim()) {
      params.query = location.trim();
    }

    if (propType !== 'Any') {
      params.category = propType.toLowerCase();
    }

    if (budget !== 'Any') {
      if (budget === 'Under ₹30L') {
        params.maxPrice = '3000000';
      } else if (budget === '₹30L–₹60L') {
        params.minPrice = '3000000';
        params.maxPrice = '6000000';
      } else if (budget === '₹60L–₹1Cr') {
        params.minPrice = '6000000';
        params.maxPrice = '10000000';
      } else if (budget === '₹1Cr–₹2Cr') {
        params.minPrice = '10000000';
        params.maxPrice = '20000000';
      } else if (budget === 'Above ₹2Cr') {
        params.minPrice = '20000000';
      }
    }

    if (bhk !== 'Any') {
      params.bedrooms = bhk.split(' ')[0].replace('+', '');
    }

    router.push({ pathname: '/properties', params } as any);
  };

  const handlePopularSearch = (city: string) => {
    setActiveDropdown(null);
    router.push({ pathname: '/properties', params: { city } } as any);
  };

  const toggleDropdown = (type: DropdownType) => {
    setActiveDropdown((prev) => (prev === type ? null : type));
  };

  return (
    <View style={styles.heroSection}>
      <Container>
        {/* Contained Hero Card matching reference design */}
        <View style={[styles.heroCard, !isDesktop && styles.heroCardMobile]}>
          {/* Background Image inside the Card */}
          <Image
            key={currentSlide.image}
            source={{ uri: currentSlide.image }}
            style={styles.bgImage}
            resizeMode="cover"
          />

          {/* Soft Natural Gradient Overlay */}
          <View style={[styles.overlay, !isDesktop && styles.overlayMobile]} />

          {/* Dismiss backdrop when dropdown is open */}
          {activeDropdown && (
            <TouchableOpacity
              style={styles.dropdownBackdrop}
              activeOpacity={1}
              onPress={() => setActiveDropdown(null)}
            />
          )}

          {/* Hero Content on the left */}
          <View style={[styles.heroContent, !isDesktop && styles.heroContentMobile]}>
            {/* Heading */}
            <Text style={[styles.heading, isDesktop ? styles.headingDesktop : styles.headingMobile]}>
              Find a space{'\n'}that feels like home.
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, isDesktop ? styles.subtitleDesktop : styles.subtitleMobile]}>
              Discover verified homes, plots and commercial spaces across India's growing cities.
            </Text>

            {/* Search Card */}
            <View style={styles.searchCard}>
              {/* Buy / Rent / Commercial Tabs */}
              <View style={styles.typeTabs}>
                {(['buy', 'rent', 'commercial'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setActiveType(t)}
                    style={[styles.typeTab, activeType === t && styles.typeTabActive]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.typeTabText, activeType === t && styles.typeTabTextActive]}>
                      {t === 'buy' ? 'Buy' : t === 'rent' ? 'Rent' : 'Commercial'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Search Fields Row */}
              <View style={[styles.fieldsRow, !isDesktop && styles.fieldsRowMobile]}>
                {/* Field 1: Location Input */}
                <View style={[styles.fieldBox, styles.locationFieldBox]}>
                  <Feather name="map-pin" size={15} color="#94A3B8" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Search by location, society or landmark"
                    placeholderTextColor="#94A3B8"
                    value={location}
                    onChangeText={setLocation}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                </View>

                {/* Desktop Inline Selectors: Property Type, Budget, and BHK */}
                {isDesktop && (
                  <>
                    <FilterDropdown
                      label="Property Type"
                      value={propType}
                      options={PROPERTY_TYPES}
                      isOpen={activeDropdown === 'propType'}
                      onToggle={() => toggleDropdown('propType')}
                      onSelect={(val) => {
                        setPropType(val);
                        setActiveDropdown(null);
                      }}
                      showLeftBorder={true}
                    />

                    <FilterDropdown
                      label="Budget"
                      value={budget}
                      options={BUDGETS}
                      isOpen={activeDropdown === 'budget'}
                      onToggle={() => toggleDropdown('budget')}
                      onSelect={(val) => {
                        setBudget(val);
                        setActiveDropdown(null);
                      }}
                      showLeftBorder={true}
                    />

                    <FilterDropdown
                      label="BHK"
                      value={bhk}
                      options={BHK_OPTIONS}
                      isOpen={activeDropdown === 'bhk'}
                      onToggle={() => toggleDropdown('bhk')}
                      onSelect={(val) => {
                        setBhk(val);
                        setActiveDropdown(null);
                      }}
                      showLeftBorder={true}
                    />
                  </>
                )}

                {/* Field 5: Search Button */}
                <TouchableOpacity
                  onPress={handleSearch}
                  style={[styles.searchBtn, !isDesktop && styles.searchBtnMobile]}
                  activeOpacity={0.88}
                >
                  <Feather name="search" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Mobile / Tablet Compact Dropdown Row (Identical Component & Styling) */}
              {!isDesktop && (
                <View style={styles.mobileSelectorsRow}>
                  <FilterDropdown
                    label="Type"
                    value={propType}
                    options={PROPERTY_TYPES}
                    isOpen={activeDropdown === 'propType'}
                    onToggle={() => toggleDropdown('propType')}
                    onSelect={(val) => {
                      setPropType(val);
                      setActiveDropdown(null);
                    }}
                    showLeftBorder={false}
                  />

                  <FilterDropdown
                    label="Budget"
                    value={budget}
                    options={BUDGETS}
                    isOpen={activeDropdown === 'budget'}
                    onToggle={() => toggleDropdown('budget')}
                    onSelect={(val) => {
                      setBudget(val);
                      setActiveDropdown(null);
                    }}
                    showLeftBorder={true}
                  />

                  <FilterDropdown
                    label="BHK"
                    value={bhk}
                    options={BHK_OPTIONS}
                    isOpen={activeDropdown === 'bhk'}
                    onToggle={() => toggleDropdown('bhk')}
                    onSelect={(val) => {
                      setBhk(val);
                      setActiveDropdown(null);
                    }}
                    showLeftBorder={true}
                  />
                </View>
              )}

              {/* Popular Searches Chips Row */}
              <View style={styles.popularRow}>
                <Text style={styles.popularLabel}>Popular searches:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {POPULAR_SEARCHES.map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => handlePopularSearch(city)}
                      style={styles.chip}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Right Floating Card (Desktop - inside hero card matching reference) */}
          {isDesktop && (
            <View style={styles.floatCard}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(currentSlide.screen as any)}
                style={styles.floatCardClickableArea}
              >
                <Text style={styles.floatCardTitle}>{currentSlide.title}</Text>
                <Text style={styles.floatCardSub}>{currentSlide.subtitle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(currentSlide.screen as any)}
                style={styles.floatCardBtn}
                accessibilityLabel={`Open ${currentSlide.screen}`}
              >
                <Feather name="arrow-right" size={15} color="#0F172A" />
              </TouchableOpacity>

              {/* Slider Pagination & Arrow Controls */}
              <View style={styles.floatCardFooter}>
                <Text style={styles.floatCardCounter}>0{heroSlide} / 0{HERO_SLIDES.length} —</Text>
                <View style={styles.navArrows}>
                  <TouchableOpacity
                    onPress={() => setHeroSlide((s) => (s > 1 ? s - 1 : HERO_SLIDES.length))}
                    style={styles.arrowCircle}
                    accessibilityLabel="Previous slide"
                  >
                    <Feather name="chevron-left" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setHeroSlide((s) => (s < HERO_SLIDES.length ? s + 1 : 1))}
                    style={styles.arrowCircle}
                    accessibilityLabel="Next slide"
                  >
                    <Feather name="chevron-right" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  heroCard: {
    width: '100%',
    minHeight: 450,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  heroCardMobile: {
    minHeight: 'auto' as any,
    borderRadius: 18,
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0.96) 44%, rgba(255, 255, 255, 0.72) 64%, rgba(255, 255, 255, 0.12) 84%, transparent 100%)',
      } as any,
      default: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
      },
    }),
  },
  overlayMobile: {
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.94) 65%, rgba(255, 255, 255, 0.65) 100%)',
      } as any,
    }),
  },
  dropdownBackdrop: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
      default: {
        ...StyleSheet.absoluteFill,
      },
    }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    paddingHorizontal: 36,
    paddingVertical: 32,
    maxWidth: 780,
  },
  heroContentMobile: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    maxWidth: '100%',
  },
  heading: {
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  headingDesktop: {
    fontSize: 42,
    lineHeight: 50,
  },
  headingMobile: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
  },
  subtitleDesktop: {
    fontSize: 14.5,
    maxWidth: 480,
  },
  subtitleMobile: {
    fontSize: 13,
    maxWidth: '100%',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
    zIndex: 50,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.1)',
      } as any,
    }),
  },
  typeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 4,
  },
  typeTab: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
    }),
  },
  typeTabActive: {
    backgroundColor: '#0F172A',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  typeTabTextActive: {
    color: '#FFFFFF',
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldsRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  fieldBox: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    height: 48,
    zIndex: 60,
  },
  locationFieldBox: {
    flex: 2.2,
    paddingLeft: 6,
  },
  fieldBoxDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  searchBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7,
    marginLeft: 6,
    marginRight: 2,
    height: 40,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': { backgroundColor: '#1E293B' },
      } as any,
    }),
  },
  searchBtnMobile: {
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
    height: 44,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  mobileSelectorsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
    zIndex: 80,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
  },
  popularLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  chipsScroll: {
    gap: 6,
    paddingRight: 10,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': { backgroundColor: '#E2E8F0' },
      } as any,
    }),
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  // Floating Card on right (Desktop) matching reference design
  floatCard: {
    position: 'absolute',
    top: 28,
    right: 28,
    width: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
      } as any,
    }),
  },
  floatCardClickableArea: {
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  floatCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 5,
  },
  floatCardSub: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 12,
  },
  floatCardBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
        ':hover': { transform: 'scale(1.06)' },
      } as any,
    }),
  },
  floatCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  floatCardCounter: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  navArrows: {
    flexDirection: 'row',
    gap: 6,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
});
