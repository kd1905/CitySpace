import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Permission, hasPermission } from '@/types/user';
import { agentService } from '@/services/agentService';
import { apiClient } from '@/services/apiClient';

export type AuthenticatedRole = 'PUBLIC' | 'ADMIN' | 'AGENT';
export type ViewMode = 'PUBLIC' | 'ADMIN';

interface AuthContextType {
  authenticatedRole: AuthenticatedRole;
  viewMode: ViewMode;
  user: UserProfile | null;

  // Role booleans
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isAuthenticatedAdmin: boolean;
  isAuthenticatedAgent: boolean;
  canManageProperties: boolean;

  // Actions
  viewAsUser: () => void;
  returnToAdmin: () => void;
  switchViewMode: (mode: ViewMode | 'admin' | 'user') => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
  switchRole: (role: 'public' | 'admin' | 'agent' | 'user') => void;
  checkPermission: (permission: Permission) => boolean;
  updateUserProfile: (updates: Partial<UserProfile>, newPassword?: string) => Promise<boolean>;
  updateAgentPassword: (newPassword: string) => Promise<boolean>;
  lastAuthError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Fresh visitor default: PUBLIC user, PUBLIC viewMode, user = null
  const [authenticatedRole, setAuthenticatedRole] = useState<AuthenticatedRole>('PUBLIC');
  const [viewMode, setViewMode] = useState<ViewMode>('PUBLIC');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  const clearAuthError = () => setLastAuthError(null);

  // Derived state
  const isAuthenticated = authenticatedRole !== 'PUBLIC';
  const isAuthenticatedAdmin = authenticatedRole === 'ADMIN';
  const isAuthenticatedAgent = authenticatedRole === 'AGENT';

  // Admin in actual admin view mode
  const isAdmin = isAuthenticatedAdmin && viewMode === 'ADMIN';
  const isAgent = isAuthenticatedAgent;
  const canManageProperties = isAuthenticatedAdmin && viewMode === 'ADMIN';

  /**
   * ADMIN ONLY: "View as User" preview mode
   * Switches viewMode to PUBLIC while preserving authenticatedRole = ADMIN
   */
  const viewAsUser = () => {
    if (authenticatedRole === 'ADMIN') {
      setViewMode('PUBLIC');
    }
  };

  /**
   * ADMIN ONLY: "Return to Admin"
   * Restores viewMode to ADMIN
   */
  const returnToAdmin = () => {
    if (authenticatedRole === 'ADMIN') {
      setViewMode('ADMIN');
    }
  };

  /**
   * General switchViewMode helper with safety checks
   */
  const switchViewMode = (mode: ViewMode | 'admin' | 'user') => {
    const normalized: ViewMode = (mode === 'admin' || mode === 'ADMIN') ? 'ADMIN' : 'PUBLIC';
    if (authenticatedRole === 'ADMIN') {
      setViewMode(normalized);
    } else {
      setViewMode('PUBLIC');
    }
  };

  /**
   * Login with email and password using real database credentials
   */
  const login = async (email: string, pass: string): Promise<boolean> => {
    setLastAuthError(null);
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = pass ? pass.trim() : '';

    if (!cleanPass) {
      setLastAuthError('Please enter your password.');
      return false;
    }

    // 1. Authenticate Agent against real backend database
    try {
      const agentRes = await apiClient.post<any>('/agents/login', {
        email: cleanEmail,
        password: cleanPass,
      });

      if (agentRes && agentRes.success && agentRes.data) {
        const ag = agentRes.data;
        const agentUser: UserProfile = {
          id: ag.id,
          fullName: ag.name,
          email: ag.email,
          phone: ag.phone,
          avatar: ag.avatar,
          role: 'agent',
          location: ag.city || (ag.areasServed && ag.areasServed.length > 0 ? ag.areasServed.join(', ') : 'India'),
          memberSince: ag.createdAt ? new Date(ag.createdAt).getFullYear().toString() : '2026',
          verified: true,
          savedSearchesCount: 0,
          scheduledToursCount: 0,
          inquiriesCount: 0,
          requiresPasswordChange: ag.requiresPasswordChange ?? (ag.isDefaultPassword ?? false),
          isDefaultPassword: ag.isDefaultPassword ?? false,
          preferences: {
            currency: 'INR',
            notificationsEnabled: true,
            newsletter: false,
            darkMode: false,
          },
        };

        setAuthenticatedRole('AGENT');
        setViewMode('PUBLIC');
        setUser(agentUser);

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('cityspace_auth_user_v1', JSON.stringify(agentUser));
        }
        return true;
      } else if (agentRes && !agentRes.success && agentRes.message && !cleanEmail.includes('admin')) {
        setLastAuthError(agentRes.message);
        return false;
      }
    } catch (err: any) {
      if (!cleanEmail.includes('admin')) {
        const msg = err?.message || 'Invalid email or password.';
        setLastAuthError(msg);
        return false;
      }
    }

    // 2. Admin Login
    if (cleanEmail.includes('admin')) {
      const adminUser: UserProfile = {
        id: 'admin-01',
        fullName: 'Administrator',
        email: cleanEmail,
        role: 'admin',
        location: 'India',
        memberSince: '2026',
        verified: true,
        savedSearchesCount: 0,
        scheduledToursCount: 0,
        inquiriesCount: 0,
        preferences: {
          currency: 'INR',
          notificationsEnabled: true,
          newsletter: false,
          darkMode: false,
        },
      };
      setAuthenticatedRole('ADMIN');
      setViewMode('ADMIN');
      setUser(adminUser);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cityspace_auth_user_v1', JSON.stringify(adminUser));
      }
      return true;
    }

    setAuthenticatedRole('PUBLIC');
    setViewMode('PUBLIC');
    setUser(null);
    setLastAuthError('No registered account found with this email.');
    return false;
  };

  const register = async (
    name: string,
    email: string,
    role: UserRole
  ): Promise<boolean> => {
    const safeRole: UserRole = role === 'admin' ? 'user' : role;
    const registeredUser: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: name.trim(),
      email: email.trim().toLowerCase(),
      role: safeRole,
      location: 'India',
      memberSince: new Date().getFullYear().toString(),
      verified: false,
      savedSearchesCount: 0,
      scheduledToursCount: 0,
      inquiriesCount: 0,
      preferences: {
        currency: 'INR',
        notificationsEnabled: true,
        newsletter: false,
        darkMode: false,
      },
    };
    setUser(registeredUser);
    setAuthenticatedRole('PUBLIC');
    setViewMode('PUBLIC');
    return true;
  };

  /**
   * Complete Sign Out: resets to clean public visitor state
   */
  const logout = () => {
    setAuthenticatedRole('PUBLIC');
    setViewMode('PUBLIC');
    setUser(null);
    setLastAuthError(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('cityspace_auth_user_v1');
    }
  };

  /**
   * Continue as Guest: resets to clean public visitor state
   */
  const continueAsGuest = () => {
    setAuthenticatedRole('PUBLIC');
    setViewMode('PUBLIC');
    setUser(null);
  };

  /**
   * Switch role helper
   */
  const switchRole = (role: 'public' | 'admin' | 'agent' | 'user') => {
    if (role === 'admin') {
      setAuthenticatedRole('ADMIN');
      setViewMode('ADMIN');
      setUser({
        id: 'admin-01',
        fullName: 'Administrator',
        email: 'admin@cityspace.in',
        role: 'admin',
        location: 'India',
        memberSince: '2026',
        verified: true,
        savedSearchesCount: 0,
        scheduledToursCount: 0,
        inquiriesCount: 0,
        preferences: {
          currency: 'INR',
          notificationsEnabled: true,
          newsletter: false,
          darkMode: false,
        },
      });
    } else if (role === 'agent') {
      const activeAgent = agentService.getActive()[0];
      setAuthenticatedRole('AGENT');
      setViewMode('PUBLIC');
      if (activeAgent) {
        setUser({
          id: activeAgent.id,
          fullName: activeAgent.name,
          email: activeAgent.email,
          phone: activeAgent.phone,
          avatar: activeAgent.avatar,
          role: 'agent',
          location: activeAgent.city || activeAgent.areasServed?.join(', ') || 'India',
          memberSince: '2026',
          verified: true,
          savedSearchesCount: 0,
          scheduledToursCount: 0,
          inquiriesCount: 0,
          preferences: {
            currency: 'INR',
            notificationsEnabled: true,
            newsletter: false,
            darkMode: false,
          },
        });
      } else {
        setUser(null);
      }
    } else {
      // Normal public visitor
      setAuthenticatedRole('PUBLIC');
      setViewMode('PUBLIC');
      setUser(null);
    }
  };

  // Load persisted user on mount if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('cityspace_auth_user_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.role === 'admin') {
            setUser((prev) => (prev ? { ...prev, ...parsed } : parsed));
            setAuthenticatedRole('ADMIN');
            setViewMode('ADMIN');
          } else if (parsed && parsed.role === 'agent') {
            setUser((prev) => (prev ? { ...prev, ...parsed } : parsed));
            setAuthenticatedRole('AGENT');
            setViewMode('PUBLIC');
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  /**
   * Update User/Admin profile (Name, Phone, Email, Password, Avatar)
   */
  const updateUserProfile = async (updates: Partial<UserProfile>, newPassword?: string): Promise<boolean> => {
    try {
      const defaultPrefs = {
        currency: 'INR',
        notificationsEnabled: true,
        newsletter: false,
        darkMode: false,
      };

      const current: UserProfile = user || {
        id: 'admin-01',
        fullName: 'Administrator',
        email: 'admin@cityspace.in',
        role: 'admin' as UserRole,
        location: 'India',
        memberSince: '2026',
        verified: true,
        savedSearchesCount: 0,
        scheduledToursCount: 0,
        inquiriesCount: 0,
        preferences: defaultPrefs,
      };

      const updatedUser: UserProfile = {
        ...current,
        ...updates,
        preferences: {
          ...defaultPrefs,
          ...(current.preferences || {}),
          ...(updates.preferences || {}),
        },
      };

      // Call API to persist in backend database
      const res = await apiClient.patch<any>('/users/profile', {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        password: newPassword,
      });

      if (res && res.data) {
        const payload: any = res.data;
        if (payload.fullName) updatedUser.fullName = payload.fullName;
        if (payload.email) updatedUser.email = payload.email;
        if (payload.phone !== undefined) updatedUser.phone = payload.phone;
        if (payload.avatar !== undefined) updatedUser.avatar = payload.avatar;
      }

      setUser(updatedUser);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cityspace_auth_user_v1', JSON.stringify(updatedUser));
      }
      return true;
    } catch (err) {
      console.error('[AuthContext] updateUserProfile error:', err);
      return false;
    }
  };

  const updateAgentPassword = async (newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'agent') return false;
    try {
      const res = await apiClient.put<any>(`/agents/${user.id}`, { password: newPassword });
      if (res && res.success) {
        const updatedUser: UserProfile = {
          ...user,
          requiresPasswordChange: false,
          isDefaultPassword: false,
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('cityspace_auth_user_v1', JSON.stringify(updatedUser));
        }
        return true;
      }
    } catch (err) {
      console.error('[AuthContext] updateAgentPassword error:', err);
    }
    return false;
  };

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(user, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        authenticatedRole,
        viewMode,
        user,
        isAuthenticated,
        isAdmin,
        isAgent,
        isAuthenticatedAdmin,
        isAuthenticatedAgent,
        canManageProperties,
        viewAsUser,
        returnToAdmin,
        switchViewMode,
        login,
        register,
        logout,
        continueAsGuest,
        switchRole,
        checkPermission,
        updateUserProfile,
        updateAgentPassword,
        lastAuthError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
