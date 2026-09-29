import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Container } from '@/components/common/Container';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { useResponsive } from '@/hooks/useResponsive';
import { agentService } from '@/services/agentService';
import { Agent } from '@/types/agent';

export default function PublicAgentsScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [search, setSearch] = useState('');

  // Only ACTIVE agents are shown publicly as required
  const activeAgents = agentService.getActive();

  const filteredAgents = activeAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.designation.toLowerCase().includes(search.toLowerCase()) ||
      a.areasServed.some((area) =>
        area.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  };

  const handleWhatsApp = (agent: Agent) => {
    const text = encodeURIComponent(
      `Hello ${agent.name}, I am contacting you through Cityspace regarding your properties.`
    );
    const cleanPhone = agent.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`);
  };

  return (
    <View style={styles.screen}>
      <DesktopNavigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Container>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <View style={styles.badge}>
                <Feather name="shield" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>CERTIFIED ADVISORS</Text>
              </View>
              <Text style={styles.title}>Cityspace Property Consultants</Text>
              <Text style={styles.subtitle}>
                Connect with verified local advisors for personalized site visits, title scrutiny, and exclusive off-market listings.
              </Text>
            </View>

            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search by advisor or locality..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* Agents Grid */}
          {filteredAgents.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 }}>
              <Feather name="users" size={36} color="#94A3B8" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
                No Property Advisors Found
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 460 }}>
                {search
                  ? `No certified advisors matched "${search}". Try searching another area or name.`
                  : 'Certified Cityspace property advisors will appear here once registered.'}
              </Text>
            </View>
          ) : (
            <View style={styles.agentsGrid}>
              {filteredAgents.map((agent) => (
                <View key={agent.id} style={styles.agentCard}>
                  <View style={styles.cardTop}>
                    {agent.avatar ? (
                      <Image source={{ uri: agent.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Feather name="user" size={24} color="#64748B" />
                      </View>
                    )}
                    <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{agent.name}</Text>
                      <Feather name="check-circle" size={15} color="#0284C7" />
                    </View>
                    <Text style={styles.designation}>{agent.designation}</Text>
                    <Text style={styles.experience}>{agent.experience}</Text>

                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingText}>
                        {agent.rating} ({agent.reviewCount} client reviews)
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.bioText} numberOfLines={2}>
                  {agent.bio}
                </Text>

                {/* Areas Served Tags */}
                <View style={styles.areasRow}>
                  {agent.areasServed.map((area) => (
                    <View key={area} style={styles.areaTag}>
                      <Text style={styles.areaTagText}>{area}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Action Buttons: Call Now, WhatsApp, View Properties */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleCall(agent.phone)}
                    style={styles.callBtn}
                  >
                    <Feather name="phone" size={13} color="#0F172A" style={{ marginRight: 6 }} />
                    <Text style={styles.callBtnText}>CALL NOW</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleWhatsApp(agent)}
                    style={styles.whatsappBtn}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.whatsappBtnText}>WHATSAPP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/properties',
                        params: { agent: agent.id },
                      } as any)
                    }
                    style={styles.viewPropsBtn}
                  >
                    <Text style={styles.viewPropsText}>
                      {agent.activeListingsCount || 0} Listings →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          )}
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 36,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 600,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 44,
    minWidth: 280,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  agentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    flex: 1,
    minWidth: 320,
    maxWidth: 420,
    gap: 14,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E2E8F0',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  designation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  experience: {
    fontSize: 11,
    color: '#64748B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bioText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  areasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  areaTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  areaTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  whatsappBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewPropsBtn: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  viewPropsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
