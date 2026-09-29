import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/services/apiClient';
import { PropertyEnquiry } from '@/types/enquiry';

export default function AgentMessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = useCallback(async () => {
    if (!agentId) return;
    try {
      const res = await apiClient.get<PropertyEnquiry[]>(`/enquiries?agentId=${agentId}`);
      if (res.success && Array.isArray(res.data)) {
        setEnquiries(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
        }
      }
    } catch (err) {
      console.warn('[AgentMessages] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId, selectedId]);

  useEffect(() => {
    fetchEnquiries();
    const interval = setInterval(fetchEnquiries, 15000);
    return () => clearInterval(interval);
  }, [fetchEnquiries]);

  const filteredEnquiries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enquiries;
    return enquiries.filter(
      (e) =>
        e.visitorName.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        (e.propertyTitle && e.propertyTitle.toLowerCase().includes(q))
    );
  }, [enquiries, searchQuery]);

  const selectedEnquiry = useMemo(() => {
    return enquiries.find((e) => e.id === selectedId) || null;
  }, [enquiries, selectedId]);

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${clean}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedEnquiry) return;
    const clean = selectedEnquiry.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      replyText.trim() ||
        `Hello ${selectedEnquiry.visitorName}, I am ${user?.fullName || 'your Cityspace Property Advisor'} replying to your inquiry about "${selectedEnquiry.propertyTitle || 'our property listings'}".`
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
    setReplyText('');
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT CRM / INQUIRY MESSAGES</Text>
          <Text style={styles.title}>Client Inquiries & Messages</Text>
          <Text style={styles.subtitle}>
            Direct inquiries submitted by prospective buyers and tenants on your listings.
          </Text>
        </View>

        <TouchableOpacity onPress={fetchEnquiries} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.refreshBtnText}>Sync Inbox</Text>
        </TouchableOpacity>
      </View>

      {/* Main Two-Pane Box */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading client messages...</Text>
        </View>
      ) : enquiries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="message-square" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Your Inbox is Quiet</Text>
          <Text style={styles.emptySub}>
            When buyers or tenants submit an inquiry or brochure request on your assigned properties, they will appear in this communication hub.
          </Text>
        </View>
      ) : (
        <View style={styles.inboxContainer}>
          {/* Left Pane: Inquiries List */}
          <View style={styles.inboxListPane}>
            <View style={styles.searchBox}>
              <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.threadScroll} showsVerticalScrollIndicator={false}>
              {filteredEnquiries.map((enq) => {
                const isSelected = enq.id === selectedId;
                return (
                  <TouchableOpacity
                    key={enq.id}
                    onPress={() => setSelectedId(enq.id)}
                    style={[styles.threadItem, isSelected && styles.threadItemActive]}
                  >
                    <View style={styles.threadTopRow}>
                      <Text style={[styles.threadName, isSelected && styles.threadNameActive]}>
                        {enq.visitorName}
                      </Text>
                      <Text style={styles.threadTime}>
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={styles.threadProp} numberOfLines={1}>
                      {enq.propertyTitle || 'General Inquiry'}
                    </Text>

                    <Text style={styles.threadSnippet} numberOfLines={1}>
                      {enq.message || 'Interested in property inspection and pricing details.'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Pane: Selected Conversation Details */}
          {selectedEnquiry ? (
            <View style={styles.chatPane}>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderInfo}>
                  <Text style={styles.chatClientName}>{selectedEnquiry.visitorName}</Text>
                  <Text style={styles.chatClientContacts}>
                    {selectedEnquiry.phone} {selectedEnquiry.email ? `• ${selectedEnquiry.email}` : ''}
                  </Text>
                  <Text style={styles.chatPropTitle} numberOfLines={1}>
                    Re: {selectedEnquiry.propertyTitle || 'General Property Inquiry'}
                  </Text>
                </View>

                <View style={styles.chatHeaderActions}>
                  <TouchableOpacity
                    onPress={() => handleCall(selectedEnquiry.phone)}
                    style={styles.actionBtnCall}
                  >
                    <Feather name="phone-call" size={13} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnCallText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendWhatsApp}
                    style={styles.actionBtnWa}
                  >
                    <Feather name="message-circle" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnWaText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chat Message Bubble */}
              <ScrollView style={styles.chatMessagesBody} contentContainerStyle={{ padding: 20, gap: 16 }}>
                <View style={styles.msgBubbleClient}>
                  <View style={styles.bubbleHeader}>
                    <Text style={styles.bubbleSender}>{selectedEnquiry.visitorName}</Text>
                    <Text style={styles.bubbleTime}>{new Date(selectedEnquiry.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.bubbleText}>
                    {selectedEnquiry.message ||
                      'Hello, I am interested in this property and would like to receive verified documentation, pricing breakdown, and schedule an on-site visit.'}
                  </Text>

                  {selectedEnquiry.buyerBudget || selectedEnquiry.buyerLocation ? (
                    <View style={styles.buyerReqsPill}>
                      <Text style={styles.buyerReqsText}>
                        Criteria: {selectedEnquiry.buyerBudget ? `Budget: ${selectedEnquiry.buyerBudget} ` : ''}
                        {selectedEnquiry.buyerLocation ? `| Location: ${selectedEnquiry.buyerLocation}` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              {/* Quick WhatsApp Reply Input */}
              <View style={styles.replyFooter}>
                <TextInput
                  style={styles.replyInput}
                  placeholder={`Compose WhatsApp response to ${selectedEnquiry.visitorName}...`}
                  placeholderTextColor="#94A3B8"
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <TouchableOpacity onPress={handleSendWhatsApp} style={styles.sendBtn}>
                  <Feather name="send" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.sendBtnText}>Send WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.chatPane, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#94A3B8' }}>Select a conversation from the left</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
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
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    paddingVertical: 80,
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
  inboxContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 520,
    overflow: 'hidden',
    ...Shadows.md,
  },
  inboxListPane: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  threadScroll: {
    flex: 1,
  },
  threadItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 4,
  },
  threadItemActive: {
    backgroundColor: '#E0F2FE',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  threadNameActive: {
    color: '#0369A1',
  },
  threadTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  threadProp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  threadSnippet: {
    fontSize: 12,
    color: '#64748B',
  },
  chatPane: {
    flex: 1,
    flexDirection: 'column',
  },
  chatHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  chatHeaderInfo: {
    gap: 3,
    flex: 1,
    minWidth: 200,
  },
  chatClientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  chatClientContacts: {
    fontSize: 12,
    color: '#64748B',
  },
  chatPropTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionBtnWa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  actionBtnWaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatMessagesBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  msgBubbleClient: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
    maxWidth: 580,
    ...Shadows.sm,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bubbleSender: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bubbleTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bubbleText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  buyerReqsPill: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  buyerReqsText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  replyFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
