import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { PropertyAgent } from '@/types/property';

export interface AgentCardProps {
  agent: PropertyAgent;
  propertyTitle: string;
  onSendEnquiry?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  propertyTitle,
  onSendEnquiry,
}) => {
  const handleCall = () => {
    const cleanPhone = agent.phone.replace(/\s+/g, '');
    if (Platform.OS === 'web') {
      window.open(`tel:${cleanPhone}`);
    } else {
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  const handleWhatsApp = () => {
    const cleanPhone = agent.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${agent.name}, I am interested in viewing "${propertyTitle}" on Cityspace. Please share further details.`
    );
    const url = `https://wa.me/${cleanPhone}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleShare = () => {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        navigator.share({
          title: propertyTitle,
          text: `Check out ${propertyTitle} on Cityspace with advisor ${agent.name}`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(window.location.href);
        window.alert('Property link copied to clipboard!');
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeader}>EXCLUSIVE PROPERTY ADVISOR</Text>

      {/* Agent Info Row */}
      <View style={styles.agentInfoRow}>
        <Image source={{ uri: agent.avatar }} style={styles.avatar} />
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{agent.name}</Text>
            {agent.verified && (
              <Feather
                name="check-circle"
                size={14}
                color="#0284C7"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          <Text style={styles.designation}>
            {agent.designation || 'Senior Luxury Property Advisor'}
          </Text>
          <Text style={styles.agency}>{agent.agency}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Feather name="layers" size={11} color="#64748B" style={{ marginRight: 3 }} />
              <Text style={styles.metricText}>
                {agent.propertiesHandled || 14} Properties Handled
              </Text>
            </View>
            <Text style={styles.metricDot}>•</Text>
            <View style={styles.metricItem}>
              <Feather name="star" size={11} color="#D97706" style={{ marginRight: 3 }} />
              <Text style={styles.metricText}>
                {agent.rating} ({agent.reviewCount})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Info Row */}
      <View style={styles.contactDetails}>
        <View style={styles.contactRow}>
          <Feather name="phone" size={13} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.contactText}>{agent.phone}</Text>
        </View>
        <View style={styles.contactRow}>
          <Feather name="mail" size={13} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.contactText}>{agent.email}</Text>
        </View>
      </View>

      {/* The 4 Required Buttons */}
      <View style={styles.actionsGrid}>
        <View style={styles.topBtnRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCall}
            style={styles.callNowBtn}
          >
            <Feather name="phone" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.callNowBtnText}>CALL NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWhatsApp}
            style={styles.whatsAppBtn}
          >
            <Feather name="message-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.whatsAppBtnText}>WHATSAPP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSendEnquiry}
          style={styles.enquiryBtn}
        >
          <Feather name="mail" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.enquiryBtnText}>SEND ENQUIRY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShare}
          style={styles.shareBtn}
        >
          <Feather name="share-2" size={14} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.shareBtnText}>SHARE PROPERTY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    ...Shadows.sm,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#0284C7',
  },
  agentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  details: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  designation: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  agency: {
    fontSize: 11,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  metricDot: {
    color: '#CBD5E1',
  },
  contactDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#475569',
  },
  actionsGrid: {
    gap: 10,
    marginTop: 4,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  enquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  enquiryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  shareBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
