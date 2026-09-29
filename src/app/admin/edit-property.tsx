import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types/property';
import { PropertyForm } from '@/components/admin/PropertyForm';

export default function AdminEditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const property = useMemo(() => {
    if (!id) return null;
    const all = propertyService.getAllAdmin();
    return all.find((p) => p.id === id) || null;
  }, [id]);

  const handleSubmit = (
    data: Omit<Property, 'id' | 'slug' | 'createdAt'>,
    action: 'draft' | 'published'
  ) => {
    if (!id) return;

    propertyService.updateProperty(id, {
      ...data,
      status: action,
    });

    if (Platform.OS === 'web') {
      window.alert(
        `Property "${data.title}" successfully updated and saved as ${action.toUpperCase()}!`
      );
    }

    router.push('/admin/properties');
  };

  const handleCancel = () => {
    router.push('/admin/properties');
  };

  if (!property) {
    return (
      <View style={styles.notFoundContainer}>
        <Feather name="alert-circle" size={40} color="#DC2626" />
        <Text style={styles.notFoundTitle}>Property Record Not Found</Text>
        <Text style={styles.notFoundSub}>
          The property with ID "{id}" could not be retrieved from inventory.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/properties')}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Back to Properties</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <PropertyForm
        mode="edit"
        initialData={property}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
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
    width: '100%',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notFoundSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
