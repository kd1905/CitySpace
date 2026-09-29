import React from 'react';
import { Slot, Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout() {
  const { authenticatedRole, viewMode, returnToAdmin } = useAuth();

  React.useEffect(() => {
    if (authenticatedRole === 'ADMIN' && viewMode !== 'ADMIN') {
      returnToAdmin();
    }
  }, [authenticatedRole, viewMode]);

  // Route Guard: Direct unauthenticated or non-admin visitors to Login screen directly
  if (authenticatedRole !== 'ADMIN') {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated Administrator Layout with Persistent Admin Navigation
  return (
    <AdminSidebar>
      <Slot />
    </AdminSidebar>
  );
}
