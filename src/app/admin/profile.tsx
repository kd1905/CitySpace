import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
];

export default function AdminProfileScreen() {
  const { user, updateUserProfile } = useAuth();

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || 'Administrator');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'admin@cityspace.in');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync if user context changes
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setStatusMessage(null);

    // Basic validations
    if (!fullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name / Username cannot be empty.' });
      return;
    }

    if (!phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Contact Number cannot be empty.' });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid email address.' });
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'New password and confirm password do not match.' });
        return;
      }
    }

    setLoading(true);
    try {
      const ok = await updateUserProfile(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          avatar: avatar.trim(),
        },
        newPassword.trim() ? newPassword.trim() : undefined
      );

      if (ok) {
        setStatusMessage({
          type: 'success',
          text: newPassword
            ? 'Admin profile and password updated successfully in database!'
            : 'Admin profile updated successfully!',
        });
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setFullName(user.fullName || 'Administrator');
      setPhone(user.phone || '+91 98765 43210');
      setEmail(user.email || 'admin@cityspace.in');
      setAvatar(user.avatar || '');
    }
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setStatusMessage(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Profile & Credentials</Text>
          <Text style={styles.subtitle}>
            Manage your administrator username, contact phone number, credentials, and profile settings
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Feather name="shield" size={14} color="#047857" style={{ marginRight: 6 }} />
          <Text style={styles.headerBadgeText}>SUPER ADMIN</Text>
        </View>
      </View>

      {/* Notification / Toast feedback */}
      {statusMessage && (
        <View
          style={[
            styles.feedbackBanner,
            statusMessage.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Feather
            name={statusMessage.type === 'success' ? 'check-circle' : 'alert-triangle'}
            size={18}
            color={statusMessage.type === 'success' ? '#047857' : '#B91C1C'}
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              styles.feedbackText,
              { color: statusMessage.type === 'success' ? '#065F46' : '#991B1B' },
            ]}
          >
            {statusMessage.text}
          </Text>
        </View>
      )}

      {/* Grid Layout for Profile Editing */}
      <View style={styles.mainGrid}>
        {/* Left Column: Avatar & Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Feather name="user" size={40} color="#64748B" />
              </View>
            )}
            <View style={styles.activeOnlineDot} />
          </View>

          <Text style={styles.cardName}>{fullName || 'Administrator'}</Text>
          <Text style={styles.cardRole}>Root System Administrator</Text>

          <View style={styles.infoPillsContainer}>
            <View style={styles.pillItem}>
              <Feather name="mail" size={13} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.pillText} numberOfLines={1}>
                {email || 'admin@cityspace.in'}
              </Text>
            </View>
            <View style={styles.pillItem}>
              <Feather name="phone" size={13} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.pillText}>{phone || '+91 98765 43210'}</Text>
            </View>
            <View style={styles.pillItem}>
              <Feather name="check-circle" size={13} color="#059669" style={{ marginRight: 6 }} />
              <Text style={[styles.pillText, { color: '#059669', fontWeight: '600' }]}>
                Full Database Access
              </Text>
            </View>
          </View>

          {/* Quick preset avatar selector */}
          <Text style={styles.avatarSectionTitle}>Choose Avatar Style</Text>
          <View style={styles.presetAvatarsRow}>
            {PRESET_AVATARS.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setAvatar(url)}
                style={[
                  styles.presetAvatarThumb,
                  avatar === url && styles.presetAvatarThumbActive,
                ]}
              >
                <Image source={{ uri: url }} style={styles.presetAvatarImg} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setAvatar('')}
              style={[
                styles.presetAvatarThumb,
                !avatar && styles.presetAvatarThumbActive,
              ]}
            >
              <Feather name="user-x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Custom Avatar Image URL</Text>
            <TextInput
              style={styles.textInput}
              value={avatar}
              onChangeText={setAvatar}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Right Column: Editable Profile & Security Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            <Feather name="user-check" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            Profile Details
          </Text>

          {/* User Name field */}
          <View style={styles.formRow}>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>
                Admin Username / Full Name <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Feather name="user" size={16} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Administrator or John Doe"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.inputHelp}>
                This name is displayed throughout the Admin portal, audit logs, and reports.
              </Text>
            </View>
          </View>

          {/* Contact No / Phone field */}
          <View style={styles.formRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>
                Contact Number (Phone) <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Feather name="phone" size={16} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>
                Admin Email Address <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Feather name="mail" size={16} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@cityspace.in"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Password Settings */}
          <Text style={styles.sectionTitle}>
            <Feather name="lock" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            Security & Password Update
          </Text>
          <Text style={styles.sectionSub}>
            Leave blank if you do not want to change your current password.
          </Text>

          <View style={styles.formRow}>
            {/* New Password */}
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="key" size={16} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="check" size={16} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-type new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Password matching feedback */}
          {newPassword && confirmPassword && (
            <View style={styles.passwordMatchNotice}>
              <Feather
                name={newPassword === confirmPassword ? 'check-circle' : 'alert-circle'}
                size={14}
                color={newPassword === confirmPassword ? '#059669' : '#DC2626'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: newPassword === confirmPassword ? '#059669' : '#DC2626',
                }}
              >
                {newPassword === confirmPassword
                  ? 'Passwords match'
                  : 'Passwords do not match yet'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Reset Fields</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Save Profile Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 20,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  profileCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    alignSelf: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  activeOnlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  infoPillsContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillText: {
    fontSize: 12,
    color: '#334155',
  },
  avatarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    alignSelf: 'flex-start',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetAvatarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  presetAvatarThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  presetAvatarThumbActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  formCard: {
    flex: 2,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  inputGroupFull: {
    flex: 1,
    minWidth: '100%',
  },
  inputGroupHalf: {
    flex: 1,
    minWidth: 240,
  },
  inputGroup: {
    width: '100%',
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#EF4444',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInputWithIcon: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  inputHelp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 5,
  },
  eyeBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  passwordMatchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
