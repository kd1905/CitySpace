import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types/property';
import { PropertyForm } from '@/components/admin/PropertyForm';

export default function AdminAddPropertyScreen() {
  const router = useRouter();

  const handleSubmit = (
    data: Omit<Property, 'id' | 'slug' | 'createdAt'>,
    action: 'draft' | 'published'
  ) => {
    const newProperty = propertyService.createProperty({
      ...data,
      status: action,
    });

    if (Platform.OS === 'web') {
      window.alert(
        `Property "${newProperty.title}" successfully saved as ${action.toUpperCase()}!`
      );
    }

    router.push('/admin/properties');
  };

  const handleCancel = () => {
    router.push('/admin/properties');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <PropertyForm
        mode="create"
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
});
