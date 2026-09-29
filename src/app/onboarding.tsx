import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { Button } from '@/components/common/Button';
import { useResponsive } from '@/hooks/useResponsive';
import { Feather } from '@expo/vector-icons';

interface Slide {
  id: string;
  badge: string;
  title: string;
  description: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: '1',
    badge: 'CURATED ARCHITECTURE',
    title: 'Spaces defined by design, not just square footage.',
    description:
      'Every residence featured on Cityspace undergoes strict curation to ensure peerless craftsmanship, visionary architecture, and rare location value.',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: '2',
    badge: 'VERIFIED INTEGRITY',
    title: 'Transparent spatial data and authentic provenance.',
    description:
      'Gain immediate access to verified floorplans, high-fidelity photo essays, and accurate property details with zero clickbait.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: '3',
    badge: 'SEAMLESS ACCESS',
    title: 'Private viewings and direct broker representation.',
    description:
      'Schedule exclusive in-person viewings or dispatch inquiries directly to verified listing partners with complete privacy.',
    image:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=85',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLast = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const slide = slides[currentSlide];

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>C</Text>
          </View>
          <Text style={styles.brandText}>CITYSPACE</Text>
        </View>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip to Explore</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View
        style={[
          styles.contentContainer,
          isDesktop ? styles.desktopLayout : styles.mobileLayout,
        ]}
      >
        {/* Visual Showcase Card */}
        <View
          style={[
            styles.imageWrapper,
            isDesktop ? styles.imageWrapperDesktop : styles.imageWrapperMobile,
          ]}
        >
          <Image
            source={{ uri: slide.image }}
            style={styles.slideImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        {/* Narrative & Controls */}
        <View
          style={[
            styles.textSection,
            isDesktop ? styles.textSectionDesktop : styles.textSectionMobile,
          ]}
        >
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{slide.badge}</Text>
          </View>

          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {slides.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentSlide(idx)}
                style={[
                  styles.dot,
                  currentSlide === idx && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title={isLast ? 'Enter Cityspace' : 'Next Space'}
              onPress={handleNext}
              variant="primary"
              size="lg"
              icon={isLast ? 'check' : 'arrow-right'}
              iconPosition="right"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.select({ ios: 54, default: 24 }),
    paddingBottom: Platform.select({ ios: 34, default: 24 }),
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.primary,
  },
  skipBtn: {
    padding: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopLayout: {
    flexDirection: 'row',
    gap: 48,
  },
  mobileLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  imageWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
  },
  imageWrapperDesktop: {
    flex: 1.2,
    height: 480,
    width: '100%',
  },
  imageWrapperMobile: {
    width: '100%',
    height: 280,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 15, 25, 0.08)',
  },
  textSection: {
    justifyContent: 'center',
  },
  textSectionDesktop: {
    flex: 1,
    paddingLeft: 16,
  },
  textSectionMobile: {
    width: '100%',
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.accentDark,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 14,
  },
  slideDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
