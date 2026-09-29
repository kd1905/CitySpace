import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { enquiryService } from '@/services/enquiryService';

export interface PublicEnquiryFormProps {
  propertyId: string;
  propertyTitle: string;
  assignedAgentId?: string;
  onSuccess?: () => void;
}

export const PublicEnquiryForm: React.FC<PublicEnquiryFormProps> = ({
  propertyId,
  propertyTitle,
  assignedAgentId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    `I would like more information on ${propertyTitle} and to schedule an exclusive showing.`
  );
  const [contactMethod, setContactMethod] = useState<'phone' | 'whatsapp' | 'email'>('whatsapp');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!phone.trim() || phone.trim().length < 8) errs.phone = 'Valid contact phone is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    enquiryService.submitPublicEnquiry({
      propertyId,
      propertyTitle,
      visitorName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim(),
      preferredContactMethod: contactMethod,
      assignedAgentId,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    if (onSuccess) onSuccess();
  };

  if (isSubmitted) {
    return (
      <View style={styles.successCard}>
        <View style={styles.successIconBox}>
          <Feather name="check" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Enquiry Received</Text>
        <Text style={styles.successMessage}>
          Thank you. Our property consultant will contact you shortly.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsSubmitted(false);
            setName('');
            setPhone('');
            setEmail('');
          }}
          style={styles.resetBtn}
        >
          <Text style={styles.resetBtnText}>Send Another Enquiry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.overline}>DIRECT INQUIRY (NO LOGIN REQUIRED)</Text>
        <Text style={styles.formTitle}>Consult an Advisor</Text>
        <Text style={styles.formSubtitle}>
          Connect directly with the designated Cityspace consultant for verified price history, floor plans, and site visits.
        </Text>
      </View>

      <View style={styles.fields}>
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>YOUR NAME *</Text>
          <TextInput
            placeholder="e.g. Vikramaditya Joshi"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setErrors((prev) => {
                if (!prev.name) return prev;
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }}
            style={[styles.input, errors.name ? styles.inputError : null]}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PHONE NUMBER *</Text>
          <TextInput
            placeholder="e.g. +91 98220 12345"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setErrors((prev) => {
                if (!prev.phone) return prev;
                const next = { ...prev };
                delete next.phone;
                return next;
              });
            }}
            style={[styles.input, errors.phone ? styles.inputError : null]}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
          <TextInput
            placeholder="e.g. vikram@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        {/* Preferred Contact Method */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PREFERRED CONTACT METHOD</Text>
          <View style={styles.methodRow}>
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: 'message-circle' },
              { id: 'phone', label: 'Phone Call', icon: 'phone' },
              { id: 'email', label: 'Email', icon: 'mail' },
            ].map((m) => {
              const isSelected = contactMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setContactMethod(m.id as any)}
                  style={[styles.methodBtn, isSelected && styles.methodBtnActive]}
                >
                  <Feather
                    name={m.icon as any}
                    size={12}
                    color={isSelected ? '#0284C7' : '#64748B'}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.methodBtnText,
                      isSelected && styles.methodBtnTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Message */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>MESSAGE / REQUIREMENTS</Text>
          <TextInput
            placeholder="Specify preferred timing for visit, financial inquiries..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={message}
            onChangeText={setMessage}
            style={styles.textArea}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitBtn}
        >
          <Feather name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Submitting Enquiry...' : 'SEND ENQUIRY'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    ...Shadows.sm,
  },
  formHeader: {
    gap: 4,
  },
  overline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#0284C7',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  fields: {
    gap: 12,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
    minHeight: 70,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  methodBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0284C7',
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  methodBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 32,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    ...Shadows.sm,
  },
  successIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  successMessage: {
    fontSize: 14,
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
