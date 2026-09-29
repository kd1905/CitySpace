import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PropertyStatus } from '@/types/property';

interface PropertyStatusBadgeProps {
  status?: PropertyStatus;
  verified?: boolean;
  featured?: boolean;
  size?: 'sm' | 'md';
}

export const PropertyStatusBadge: React.FC<PropertyStatusBadgeProps> = ({
  status,
  verified,
  featured,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <View style={styles.badgeGroup}>
      {status && (
        <View
          style={[
            styles.badge,
            isSm && styles.badgeSm,
            status === 'published' && styles.publishedBadge,
            status === 'draft' && styles.draftBadge,
            status === 'unpublished' && styles.unpublishedBadge,
          ]}
        >
          <View
            style={[
              styles.dot,
              status === 'published' && styles.publishedDot,
              status === 'draft' && styles.draftDot,
              status === 'unpublished' && styles.unpublishedDot,
            ]}
          />
          <Text
            style={[
              styles.text,
              isSm && styles.textSm,
              status === 'published' && styles.publishedText,
              status === 'draft' && styles.draftText,
              status === 'unpublished' && styles.unpublishedText,
            ]}
          >
            {status === 'published'
              ? 'Published'
              : status === 'draft'
              ? 'Draft'
              : 'Unpublished'}
          </Text>
        </View>
      )}

      {verified !== undefined && (
        <View
          style={[
            styles.badge,
            isSm && styles.badgeSm,
            verified ? styles.verifiedBadge : styles.unverifiedBadge,
          ]}
        >
          <Feather
            name={verified ? 'check-circle' : 'circle'}
            size={isSm ? 10 : 12}
            color={verified ? '#0284C7' : '#94A3B8'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.text,
              isSm && styles.textSm,
              verified ? styles.verifiedText : styles.unverifiedText,
            ]}
          >
            {verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      )}

      {featured && (
        <View
          style={[
            styles.badge,
            isSm && styles.badgeSm,
            styles.featuredBadge,
          ]}
        >
          <Feather
            name="star"
            size={isSm ? 10 : 12}
            color="#D97706"
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.text,
              isSm && styles.textSm,
              styles.featuredText,
            ]}
          >
            Featured
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 11,
  },

  // Published
  publishedBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  publishedDot: {
    backgroundColor: '#059669',
  },
  publishedText: {
    color: '#065F46',
  },

  // Draft
  draftBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  draftDot: {
    backgroundColor: '#D97706',
  },
  draftText: {
    color: '#92400E',
  },

  // Unpublished
  unpublishedBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  unpublishedDot: {
    backgroundColor: '#64748B',
  },
  unpublishedText: {
    color: '#475569',
  },

  // Verified
  verifiedBadge: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  verifiedText: {
    color: '#0369A1',
  },
  unverifiedBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  unverifiedText: {
    color: '#64748B',
  },

  // Featured
  featuredBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  featuredText: {
    color: '#B45309',
  },
});
