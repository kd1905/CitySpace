import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';
import { Feather } from '@expo/vector-icons';

export interface ImageGalleryProps {
  images: string[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const { isDesktop, width } = useResponsive();
  const [activeIndex, setActiveIndex] = useState(0);

  // Mobile layout: Scrollable horizontal carousel
  if (!isDesktop) {
    return (
      <View style={styles.mobileContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slide = Math.round(
              e.nativeEvent.contentOffset.x /
                e.nativeEvent.layoutMeasurement.width
            );
            if (slide !== activeIndex) {
              setActiveIndex(slide);
            }
          }}
          scrollEventThrottle={16}
        >
          {images.map((imgUrl, index) => (
            <Image
              key={index}
              source={{ uri: imgUrl }}
              style={[styles.mobileImage, { width }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Floating Photo Counter */}
        <View style={styles.counterBadge}>
          <Feather name="image" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.counterText}>
            {activeIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    );
  }

  // Desktop layout: Luxury Architectural Gallery Grid
  const mainImage = images[activeIndex] || images[0];
  const sideImages = images.slice(1, 4);

  return (
    <View style={styles.desktopContainer}>
      {/* Big Main Image */}
      <View style={styles.mainImageWrapper}>
        <Image
          source={{ uri: mainImage }}
          style={styles.desktopMainImage}
          resizeMode="cover"
        />
        <View style={styles.desktopCounter}>
          <Text style={styles.desktopCounterText}>
            Photo {activeIndex + 1} of {images.length}
          </Text>
        </View>
      </View>

      {/* Side Thumbnails */}
      <View style={styles.desktopThumbnails}>
        {images.map((img, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={() => setActiveIndex(idx)}
            style={[
              styles.thumbnailWrapper,
              activeIndex === idx && styles.thumbnailActive,
            ]}
          >
            <Image
              source={{ uri: img }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: Colors.surfaceAlt,
  },
  mobileImage: {
    height: 320,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  desktopContainer: {
    flexDirection: 'row',
    gap: 16,
    height: 480,
    marginBottom: 24,
  },
  mainImageWrapper: {
    flex: 3,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
  },
  desktopMainImage: {
    width: '100%',
    height: '100%',
  },
  desktopCounter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  desktopCounterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  desktopThumbnails: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  thumbnailWrapper: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  thumbnailActive: {
    borderColor: Colors.accent,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
