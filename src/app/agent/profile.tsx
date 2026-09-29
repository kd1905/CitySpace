import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/services/apiClient';
import { propertyService } from '@/services/propertyService';
import { Agent } from '@/types/agent';

export default function AgentProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agentId = user?.id || '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const assignedListingsCount = propertyService.getByAgent(agentId).length;

  const loadAgentProfile = useCallback(async () => {
    if (!agentId) return;
    try {
      const res = await apiClient.get<Agent>(`/agents/${agentId}`);
      if (res.success && res.data) {
        setAgent(res.data);
        setName(res.data.name || user?.fullName || '');
        setPhone(res.data.phone || user?.phone || '');
        setCity(res.data.city || 'Mumbai');
        setBio(res.data.bio || '');
      } else {
        // Fallback to current auth user
        setName(user?.fullName || '');
        setPhone(user?.phone || '');
        setCity('Mumbai');
      }
    } catch (err) {
      console.warn('[AgentProfile] Error fetching agent profile:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId, user]);

  useEffect(() => {
    loadAgentProfile();
  }, [loadAgentProfile]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await apiClient.put<Agent>(`/agents/${agentId}`, {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      if (res.success && res.data) {
        setAgent(res.data);
      }
      setIsEditing(false);
      setSaveMessage('Profile details updated successfully in the database.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      console.error('[AgentProfile] Save error:', err);
      setSaveMessage(`Failed to update profile: ${err.message || 'Server error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/agents/${agentId}`, { password: newPassword });
      setPasswordSuccess('Password updated successfully! Use your new password on next login.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyProfileLink = () => {
    if (Platform.OS === 'web') {
      const url = `${window.location.origin}/agents`;
      navigator.clipboard?.writeText(url);
      window.alert('Public Advisor Profile URL copied to clipboard!');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.overline}>AGENT PORTAL / ADVISOR CREDENTIALS</Text>
          <Text style={styles.title}>Advisor Profile & Security</Text>
          <Text style={styles.subtitle}>
            Manage your certified credentials, territory details, and account security.
          </Text>
        </View>

        <TouchableOpacity onPress={handleCopyProfileLink} style={styles.shareProfileBtn}>
          <Feather name="share-2" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.shareProfileText}>Share Public Profile</Text>
        </TouchableOpacity>
      </View>

      {saveMessage && (
        <View style={styles.bannerSuccess}>
          <Feather name="check-circle" size={16} color="#059669" style={{ marginRight: 8 }} />
          <Text style={styles.bannerSuccessText}>{saveMessage}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      ) : (
        <View style={styles.mainCard}>
          {/* Top Profile Header */}
          <View style={styles.topProfileRow}>
            {agent?.avatar || user?.avatar ? (
              <Image source={{ uri: agent?.avatar || user?.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.noAvatar]}>
                <Text style={styles.avatarInitial}>
                  {(agent?.name || user?.fullName || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{agent?.name || user?.fullName}</Text>
                <View style={styles.verifiedPill}>
                  <Feather name="check-circle" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedText}>Certified Agent</Text>
                </View>
              </View>

              <Text style={styles.designation}>{agent?.designation || 'Property Advisor'}</Text>

              <View style={styles.statsRow}>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>{agent?.city || city || 'Pan-India'}</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <View style={styles.metaItem}>
                  <Feather name="home" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>{assignedListingsCount} Assigned Listings</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <View style={styles.metaItem}>
                  <Feather name="star" size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>{agent?.rating || '5.0'} Rating</Text>
                </View>
              </View>
            </View>

            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editProfileBtn}>
                <Feather name="edit-2" size={13} color="#0284C7" style={{ marginRight: 5 }} />
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Form or Info View */}
          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.formSectionTitle}>EDIT ADVISOR DETAILS</Text>

              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Primary City / Territory</Text>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Mumbai, Bengaluru, Delhi"
                  />
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Professional Bio & Narrative</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share your specialization, years of experience, and customer service approach..."
                />
              </View>

              <View style={styles.editFormActions}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelBtn}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  style={styles.saveBtn}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Bio */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>ADVISOR BIOGRAPHY</Text>
                <Text style={styles.bodyText}>
                  {agent?.bio ||
                    'Specialized luxury and residential real estate advisory consultant representing Cityspace. Dedicated to seamless client inspections, negotiations, and end-to-end title verification.'}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Contact Information */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>CONTACT DETAILS & ACCESS</Text>
                <View style={styles.contactGrid}>
                  <View style={styles.contactCard}>
                    <Feather name="phone" size={16} color="#0284C7" />
                    <View>
                      <Text style={styles.contactLabel}>Direct Line</Text>
                      <Text style={styles.contactVal}>{agent?.phone || phone || 'Not Set'}</Text>
                    </View>
                  </View>

                  <View style={styles.contactCard}>
                    <Feather name="mail" size={16} color="#0284C7" />
                    <View>
                      <Text style={styles.contactLabel}>Corporate Email</Text>
                      <Text style={styles.contactVal}>{agent?.email || user?.email}</Text>
                    </View>
                  </View>

                  <View style={styles.contactCard}>
                    <Feather name="map-pin" size={16} color="#0284C7" />
                    <View>
                      <Text style={styles.contactLabel}>Primary Jurisdiction</Text>
                      <Text style={styles.contactVal}>{agent?.city || city || 'Pan-India'}</Text>
                    </View>
                  </View>

                  <View style={styles.contactCard}>
                    <Feather name="shield" size={16} color="#0284C7" />
                    <View>
                      <Text style={styles.contactLabel}>Role & Permissions</Text>
                      <Text style={styles.contactVal}>Certified Cityspace Agent</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Security & Password Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.passwordHeader}>
              <View>
                <Text style={styles.sectionTitle}>ACCOUNT SECURITY & PASSWORD</Text>
                <Text style={styles.bodySub}>
                  Update your personal login password for direct Agent Portal access.
                </Text>
              </View>

              {!isChangingPassword && (
                <TouchableOpacity
                  onPress={() => setIsChangingPassword(true)}
                  style={styles.changePasswordBtn}
                >
                  <Feather name="lock" size={13} color="#475569" style={{ marginRight: 6 }} />
                  <Text style={styles.changePasswordBtnText}>Change Password</Text>
                </TouchableOpacity>
              )}
            </View>

            {isChangingPassword && (
              <View style={styles.passwordForm}>
                {passwordError ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}

                {passwordSuccess ? (
                  <View style={styles.bannerSuccess}>
                    <Feather name="check-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.bannerSuccessText}>{passwordSuccess}</Text>
                  </View>
                ) : null}

                <View style={styles.formGrid}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>New Password (min 6 characters)</Text>
                    <View style={styles.passwordInputBox}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="••••••••"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <View style={styles.passwordInputBox}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="••••••••"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.editFormActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsChangingPassword(false);
                      setPasswordError('');
                    }}
                    style={styles.cancelBtn}
                    disabled={saving}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleUpdatePassword}
                    style={styles.saveBtn}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Update Password'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  shareProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shareProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerSuccessText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
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
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 28,
    gap: 24,
    ...Shadows.sm,
  },
  topProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  noAvatar: {
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileMeta: {
    flex: 1,
    minWidth: 240,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  designation: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
  dot: {
    color: '#CBD5E1',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#94A3B8',
  },
  bodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bodySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  contactCard: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  contactLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  contactVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  editForm: {
    gap: 14,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  formGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  formCol: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  changePasswordBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  passwordForm: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    padding: 18,
    gap: 14,
    marginTop: 10,
  },
  passwordInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 40,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
});
