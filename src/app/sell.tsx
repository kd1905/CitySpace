import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows, PublicContentMaxWidth } from '@/constants/layout';
import { Container } from '@/components/common/Container';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { useResponsive } from '@/hooks/useResponsive';
import { enquiryService } from '@/services/enquiryService';
import { PreferredContactMethod } from '@/types/enquiry';

export default function SellScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [propertyType, setPropertyType] = useState('Apartment');
  const [listingIntent, setListingIntent] = useState<'sell' | 'rent'>('sell');
  const [city, setCity] = useState('Pune');
  const [locality, setLocality] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [areaSqFt, setAreaSqFt] = useState('');
  const [bedrooms, setBedrooms] = useState('3');

  // Contact info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<PreferredContactMethod>('phone');

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const propertyTypes = [
    'Apartment',
    'Villa',
    'Independent House',
    'Residential Plot',
    'Commercial Office',
    'Retail Shop',
    'Agricultural Land',
  ];

  const cities = ['Pune', 'Mumbai', 'Kolhapur', 'Bengaluru', 'Hyderabad'];

  const handleSubmit = () => {
    if (!fullName.trim() || !phone.trim()) {
      setError('Please provide your name and contact phone number.');
      return;
    }

    setError('');
    enquiryService.submitSellEnquiry({
      propertyType: `${bedrooms} BHK ${propertyType} (${listingIntent === 'sell' ? 'For Sale' : 'For Rent'})`,
      city,
      locality: locality.trim(),
      visitorName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: `Expected Price: ₹${expectedPrice || 'Not specified'}. Area: ${areaSqFt || 'Not specified'} sq ft. Notes: ${message || 'Owner requesting direct Cityspace valuation.'}`,
      preferredContactMethod: contactMethod,
    });

    setSubmitted(true);
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
              <Text style={styles.titleBadgeText}>VERIFIED ADVISORY</Text>
            </View>

            <Text style={styles.mainTitle}>Sell with Cityspace</Text>
            <Text style={styles.subtitle}>
              Connect with our property specialists. We provide verified market valuations, transparent buyer matching, and complete documentation assistance across India's top hubs.
            </Text>
          </View>

          {submitted ? (
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <Feather name="check" size={32} color="#059669" />
              </View>
              <Text style={styles.successTitle}>Enquiry Received</Text>
              <Text style={styles.successMessage}>
                Thank you, {fullName}. A Cityspace consultant will contact you shortly.
              </Text>
              <Text style={styles.successSub}>
                Your property enquiry for {city} has been routed directly to our specialist advisory team.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={styles.returnHomeBtn}
              >
                <Text style={styles.returnHomeBtnText}>Return to Marketplace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              {error ? (
                <View style={styles.errorAlert}>
                  <Feather name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.errorAlertText}>{error}</Text>
                </View>
              ) : null}

              {/* Step 1: Listing Intent */}
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionHeading}>1. INTENT</Text>
                <View style={styles.chipsRow}>
                  {[
                    { id: 'sell', label: 'Sell Property' },
                    { id: 'rent', label: 'Lease / Rent Out' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setListingIntent(item.id as any)}
                      style={[
                        styles.chip,
                        listingIntent === item.id && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          listingIntent === item.id && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Step 2: Property Type */}
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionHeading}>2. PROPERTY TYPE</Text>
                <View style={styles.chipsRow}>
                  {propertyTypes.map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setPropertyType(t)}
                      style={[
                        styles.chip,
                        propertyType === t && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          propertyType === t && styles.chipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Step 3: Location & Pricing */}
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionHeading}>3. PROPERTY LOCATION & DETAILS</Text>
                <View style={styles.chipsRow}>
                  {cities.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCity(c)}
                      style={[styles.chip, city === c && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          city === c && styles.chipTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Property Location (Neighborhood / Locality) *</Text>
                    <TextInput
                      placeholder="e.g. Baner, Koregaon Park, Indiranagar"
                      placeholderTextColor="#94A3B8"
                      value={locality}
                      onChangeText={setLocality}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Expected Price (₹)</Text>
                    <TextInput
                      placeholder="e.g. 15000000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={expectedPrice}
                      onChangeText={setExpectedPrice}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Approx Carpet Area (sq ft)</Text>
                    <TextInput
                      placeholder="e.g. 1650"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={areaSqFt}
                      onChangeText={setAreaSqFt}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* Step 4: Contact Details */}
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionHeading}>4. OWNER CONTACT INFORMATION</Text>
                <View style={styles.inputGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput
                      placeholder="Your full name"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={setFullName}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Phone *</Text>
                    <TextInput
                      placeholder="+91 98000 00000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      placeholder="email@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Message */}
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.inputLabel}>Message / Property Features</Text>
                  <TextInput
                    placeholder="Floor level, facing direction, furnishing status, urgency..."
                    placeholderTextColor="#94A3B8"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                </View>
              </View>

              {/* Talk to Cityspace Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSubmit}
                style={styles.submitBtn}
              >
                <Feather name="phone-call" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Talk to Cityspace</Text>
              </TouchableOpacity>
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
  header: {
    maxWidth: 760,
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '600',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  titleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15.5,
    color: '#64748B',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    gap: 26,
    maxWidth: 820,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionGroup: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  inputCol: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    padding: 12,
    minHeight: 84,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.sm,
    padding: 12,
  },
  errorAlertText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 50,
    borderRadius: BorderRadius.md,
    marginTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': { backgroundColor: '#1E293B' },
      } as any,
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 48,
    alignItems: 'center',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 14,
    ...Shadows.card,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 440,
  },
  returnHomeBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginTop: 12,
  },
  returnHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
