import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { Container } from '@/components/common/Container';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { useResponsive } from '@/hooks/useResponsive';
import { enquiryService } from '@/services/enquiryService';
import { PreferredContactMethod } from '@/types/enquiry';

export default function ContactScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Property Advisory');
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<PreferredContactMethod>('phone');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleCall = (phoneNum: string) => {
    const clean = phoneNum.replace(/\s+/g, '');
    if (Platform.OS === 'web') {
      window.open(`tel:${clean}`);
    } else {
      Linking.openURL(`tel:${clean}`);
    }
  };

  const handleWhatsApp = (phoneNum: string) => {
    const clean = phoneNum.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      'Hello Cityspace Advisory, I would like to enquire about premium property opportunities.'
    );
    const url = `https://wa.me/${clean}?text=${text}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleSubmit = () => {
    setError('');
    if (!fullName.trim() || !phone.trim()) {
      setError('Please provide your full name and phone number.');
      return;
    }

    try {
      enquiryService.submitPublicEnquiry({
        visitorName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: `${subject}: ${message.trim()}`,
        preferredContactMethod: contactMethod,
        propertyId: 'general-advisory',
        propertyTitle: subject,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Contact enquiry submit error:', err);
      setError('An error occurred while submitting your message. Please try again.');
    }
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.backBtnText}>Back to Marketplace</Text>
            </TouchableOpacity>

            <View style={styles.titleBadge}>
              <Feather name="shield" size={13} color="#D97706" style={{ marginRight: 5 }} />
              <Text style={styles.titleBadgeText}>CITYSPACE ADVISORY NETWORK</Text>
            </View>

            <Text style={styles.mainTitle}>Contact Our Property Specialists</Text>
            <Text style={styles.subtitle}>
              Whether you are looking to buy, sell, lease luxury residential or prime commercial property across India, our licensed advisors are here to assist you.
            </Text>
          </View>

          {/* Grid Layout */}
          <View style={[styles.mainGrid, isDesktop ? styles.mainGridDesktop : styles.mainGridMobile]}>
            {/* Left: Contact Details & Offices */}
            <View style={isDesktop ? styles.colLeftDesktop : styles.colMobile}>
              {/* Direct Channels Card */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>DIRECT CHANNELS</Text>
                <Text style={styles.cardSubhead}>
                  Speak directly with an advisor during business hours (9:00 AM – 8:00 PM IST).
                </Text>

                <View style={styles.contactItem}>
                  <View style={styles.contactIconCircle}>
                    <Feather name="phone" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactItemLabel}>Direct Line / Call Center</Text>
                    <Text style={styles.contactItemValue}>+91 98230 44521</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCall('+919823044521')}
                    style={styles.actionPillBtn}
                  >
                    <Text style={styles.actionPillText}>Call Now</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactItem}>
                  <View style={[styles.contactIconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="message-circle" size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactItemLabel}>Instant WhatsApp Advisory</Text>
                    <Text style={styles.contactItemValue}>+91 98230 44521</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleWhatsApp('+919823044521')}
                    style={[styles.actionPillBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                  >
                    <Text style={[styles.actionPillText, { color: '#059669' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactItem}>
                  <View style={[styles.contactIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="mail" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactItemLabel}>Corporate Advisory Email</Text>
                    <Text style={styles.contactItemValue}>advisory@cityspace.in</Text>
                  </View>
                </View>
              </View>

              {/* Office Locations */}
              <View style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.cardHeading}>OFFICE HUBS</Text>

                <View style={styles.officeBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="map-pin" size={15} color="#2563EB" />
                    <Text style={styles.officeCity}>Pune Headquarters</Text>
                  </View>
                  <Text style={styles.officeAddress}>
                    Level 8, Prime Corporate Tower, Pan Card Club Road, Baner Hills, Pune, Maharashtra 411045
                  </Text>
                </View>

                <View style={[styles.officeBlock, { marginTop: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="map-pin" size={15} color="#2563EB" />
                    <Text style={styles.officeCity}>Mumbai Corporate Office</Text>
                  </View>
                  <Text style={styles.officeAddress}>
                    Level 12, One BKC, G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: Message Form */}
            <View style={isDesktop ? styles.colRightDesktop : styles.colMobile}>
              {submitted ? (
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <Feather name="check" size={32} color="#059669" />
                  </View>
                  <Text style={styles.successTitle}>Message Received</Text>
                  <Text style={styles.successMessage}>
                    Thank you, {fullName}. A Cityspace property consultant will connect with you via {contactMethod} shortly.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    style={styles.newMsgBtn}
                  >
                    <Text style={styles.newMsgBtnText}>Send Another Message</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.formCard}>
                  <Text style={styles.cardHeading}>SEND US A MESSAGE</Text>
                  <Text style={styles.cardSubhead}>
                    Fill out your requirements and an advisor will reach out within 2 business hours.
                  </Text>

                  {error ? (
                    <View style={styles.errorAlert}>
                      <Feather name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                      <Text style={styles.errorAlertText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL NAME *</Text>
                    <TextInput
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={setFullName}
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>PHONE NUMBER *</Text>
                      <TextInput
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        style={styles.textInput}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        placeholder="rahul@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SUBJECT / REQUIREMENT</Text>
                    <TextInput
                      placeholder="e.g. Seeking 3 BHK Villa in Baner Pune"
                      placeholderTextColor="#94A3B8"
                      value={subject}
                      onChangeText={setSubject}
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PREFERRED CONTACT METHOD</Text>
                    <View style={styles.methodChips}>
                      {(['phone', 'whatsapp', 'email'] as PreferredContactMethod[]).map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setContactMethod(m)}
                          style={[
                            styles.methodChip,
                            contactMethod === m && styles.methodChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.methodChipText,
                              contactMethod === m && styles.methodChipTextActive,
                            ]}
                          >
                            {m.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>MESSAGE</Text>
                    <TextInput
                      placeholder="Share any specific preferences, budget, or timelines..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                      value={message}
                      onChangeText={setMessage}
                      style={[styles.textInput, styles.textArea]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                  >
                    <Feather name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.6,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    maxWidth: 760,
  },
  mainGrid: {
    gap: 24,
  },
  mainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainGridMobile: {
    flexDirection: 'column',
  },
  colLeftDesktop: {
    flex: 5,
  },
  colRightDesktop: {
    flex: 7,
  },
  colMobile: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    ...Shadows.sm,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  cardSubhead: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  contactItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  actionPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  officeBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  officeCity: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  officeAddress: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    gap: 16,
    ...Shadows.sm,
  },
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  methodChips: {
    flexDirection: 'row',
    gap: 8,
  },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  methodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  methodChipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 46,
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 6,
  },
  errorAlertText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...Shadows.sm,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065F46',
  },
  successMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
  newMsgBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  newMsgBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
