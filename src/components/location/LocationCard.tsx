import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BorderRadius } from '@/constants/layout';
import { PopularCity } from '@/constants/locations';
import { Feather } from '@expo/vector-icons';

export interface LocationCardProps {
  city: PopularCity;
  count?: number;
  onPress: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ city, count, onPress }) => {
  const displayCount =
    count !== undefined && count > 0
      ? `${count} properties`
      : 'Explore';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      <Image
        source={{ uri: city.image }}
        style={styles.image}
        resizeMode="cover"
      />
      {/* Gradient scrim bottom */}
      <View style={styles.scrim} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{displayCount}</Text>
          </View>
        </View>

        <View style={styles.bottomCol}>
          <Text style={styles.cityName}>{city.name}</Text>
          <TouchableOpacity style={styles.arrowBtn}>
            <Feather name="arrow-right" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.18)',
        },
      } as any,
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 18, 35, 0.45)',
    backgroundImage: 'linear-gradient(to top, rgba(10,18,35,0.75) 0%, transparent 60%)',
  } as any,
  content: {
    ...StyleSheet.absoluteFill,
    padding: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
