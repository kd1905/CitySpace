import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useRouter } from 'expo-router';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'types' | 'amenities' | 'cities'>('general');

  // General settings state
  const [requireVerification, setRequireVerification] = useState(true);
  const [notifyNewEnquiry, setNotifyNewEnquiry] = useState(true);
  const [autoPublishApproved, setAutoPublishApproved] = useState(false);
  const [enableVirtualTour, setEnableVirtualTour] = useState(true);

  // Property Types taxonomy
  const [propertyTypes, setPropertyTypes] = useState<string[]>([
    'Apartment',
    'Villa',
    'Penthouse',
    'Residential Plot',
    'Commercial Office',
    'Retail Showroom',
    'Studio',
    'Farm House',
  ]);
  const [newType, setNewType] = useState('');

  // Amenities taxonomy
  const [amenities, setAmenities] = useState<string[]>([
    'Swimming Pool',
    'Gymnasium & Spa',
    '24/7 Security & CCTV',
    'Power Backup',
    'Covered Car Parking',
    'Club House',
    'EV Charging Station',
    'Children Play Area',
    'High Speed Elevators',
    'Private Garden / Balcony',
  ]);
  const [newAmenity, setNewAmenity] = useState('');

  // Active City Markets
  const [cities, setCities] = useState<string[]>([
    'Mumbai',
    'Delhi NCR',
    'Bengaluru',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Goa',
    'Kolkata',
  ]);
  const [newCity, setNewCity] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddType = () => {
    if (!newType.trim()) return;
    if (propertyTypes.includes(newType.trim())) {
      showToast('This property type already exists.');
      return;
    }
    setPropertyTypes([...propertyTypes, newType.trim()]);
    setNewType('');
    showToast(`Added property category "${newType.trim()}".`);
  };

  const handleRemoveType = (item: string) => {
    setPropertyTypes(propertyTypes.filter((t) => t !== item));
    showToast(`Removed "${item}".`);
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    if (amenities.includes(newAmenity.trim())) {
      showToast('This amenity already exists.');
      return;
    }
    setAmenities([...amenities, newAmenity.trim()]);
    setNewAmenity('');
    showToast(`Added amenity "${newAmenity.trim()}".`);
  };

  const handleRemoveAmenity = (item: string) => {
    setAmenities(amenities.filter((a) => a !== item));
    showToast(`Removed "${item}".`);
  };

  const handleAddCity = () => {
    if (!newCity.trim()) return;
    if (cities.includes(newCity.trim())) {
      showToast('This city already exists in active markets.');
      return;
    }
    setCities([...cities, newCity.trim()]);
    setNewCity('');
    showToast(`Added market "${newCity.trim()}".`);
  };

  const handleRemoveCity = (item: string) => {
    setCities(cities.filter((c) => c !== item));
    showToast(`Removed "${item}".`);
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>System Settings & Master Catalog</Text>
          <Text style={styles.subtitle}>
            Configure marketplace operational rules, taxonomy master lists, amenities, and market cities.
          </Text>
        </View>

        {/* Setting Navigation Tabs */}
        <View style={styles.tabsRow}>
          {[
            { key: 'general', label: 'General & Rules', icon: 'sliders' },
            { key: 'types', label: 'Property Types', icon: 'home' },
            { key: 'amenities', label: 'Amenities Master', icon: 'check-circle' },
            { key: 'cities', label: 'Active Cities', icon: 'map-pin' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <Feather name={tab.icon as any} size={14} color={isActive ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <View>
            {/* Quick Profile Edit Shortcut */}
            <View style={[styles.card, { marginBottom: 16, backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="user-check" size={22} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Admin Profile & Credentials</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Edit your username, contact phone number, credentials, and profile options</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/admin/profile' as any)}
                  style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                >
                  <Feather name="edit-2" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Edit Admin Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>LISTING RULES & VERIFICATION</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Require Deed Verification for Public Badge</Text>
                <Text style={styles.settingDesc}>
                  Only display the verified shield on listings with verified document registries.
                </Text>
              </View>
              <Switch
                value={requireVerification}
                onValueChange={(val) => {
                  setRequireVerification(val);
                  showToast(`Deed verification requirement ${val ? 'enabled' : 'disabled'}.`);
                }}
                trackColor={{ true: Colors.primary, false: '#E2E8F0' }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-Publish Inspected Properties</Text>
                <Text style={styles.settingDesc}>
                  Automatically change draft listings to published once certified by an advisor.
                </Text>
              </View>
              <Switch
                value={autoPublishApproved}
                onValueChange={(val) => {
                  setAutoPublishApproved(val);
                  showToast(`Auto-publish ${val ? 'enabled' : 'disabled'}.`);
                }}
                trackColor={{ true: Colors.primary, false: '#E2E8F0' }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Virtual 3D Video Walkthroughs</Text>
                <Text style={styles.settingDesc}>
                  Allow embedding Matterport or YouTube 4K walk-throughs in listing headers.
                </Text>
              </View>
              <Switch
                value={enableVirtualTour}
                onValueChange={(val) => {
                  setEnableVirtualTour(val);
                  showToast(`Virtual tours ${val ? 'enabled' : 'disabled'}.`);
                }}
                trackColor={{ true: Colors.primary, false: '#E2E8F0' }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Instant Lead Inbound Push Notifications</Text>
                <Text style={styles.settingDesc}>
                  Dispatch immediate alerts to admin console when a buyer submits a new enquiry.
                </Text>
              </View>
              <Switch
                value={notifyNewEnquiry}
                onValueChange={(val) => {
                  setNotifyNewEnquiry(val);
                  showToast(`Lead notifications ${val ? 'enabled' : 'disabled'}.`);
                }}
                trackColor={{ true: Colors.primary, false: '#E2E8F0' }}
              />
            </View>
          </View>
        </View>
        )}

        {/* Tab 2: Property Types Master */}
        {activeTab === 'types' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>PROPERTY TYPES & CATEGORIES</Text>
            <Text style={styles.cardSub}>Categories available when adding or filtering properties.</Text>

            <View style={styles.addInputRow}>
              <TextInput
                value={newType}
                onChangeText={setNewType}
                placeholder="New property type (e.g. Duplex, Builder Floor)..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={handleAddType} style={styles.btnAdd}>
                <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnAddText}>Add Type</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsContainer}>
              {propertyTypes.map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t}</Text>
                  <TouchableOpacity onPress={() => handleRemoveType(t)} style={styles.chipRemove}>
                    <Feather name="x" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 3: Amenities Master */}
        {activeTab === 'amenities' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>AMENITIES & SPECIFICATIONS MASTER</Text>
            <Text style={styles.cardSub}>Standard amenities selectable during property creation.</Text>

            <View style={styles.addInputRow}>
              <TextInput
                value={newAmenity}
                onChangeText={setNewAmenity}
                placeholder="New amenity (e.g. Rooftop Lounge, Helipad)..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={handleAddAmenity} style={styles.btnAdd}>
                <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnAddText}>Add Amenity</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsContainer}>
              {amenities.map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>{a}</Text>
                  <TouchableOpacity onPress={() => handleRemoveAmenity(a)} style={styles.chipRemove}>
                    <Feather name="x" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 4: Active Cities */}
        {activeTab === 'cities' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>ACTIVE MARKET CITIES</Text>
            <Text style={styles.cardSub}>Cities with active property search and regional operations.</Text>

            <View style={styles.addInputRow}>
              <TextInput
                value={newCity}
                onChangeText={setNewCity}
                placeholder="New city market (e.g. Ahmedabad, Chandigarh)..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={handleAddCity} style={styles.btnAdd}>
                <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnAddText}>Add City</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsContainer}>
              {cities.map((c) => (
                <View key={c} style={styles.chip}>
                  <Feather name="map-pin" size={11} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.chipText}>{c}</Text>
                  <TouchableOpacity onPress={() => handleRemoveCity(c)} style={styles.chipRemove}>
                    <Feather name="x" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
    width: '100%',
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    gap: 16,
    ...Shadows.sm,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  cardSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: -8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  } as any,
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  btnAddText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  chipRemove: {
    marginLeft: 8,
    padding: 2,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  toast: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
