import { Property } from '@/types/property';
import { UserProfile } from '@/types/user';

// All dummy, mock, and sample data have been purged from the application.
// Cityspace uses exclusively real data from user input, persistent storage, and APIs.
export const MockProperties: Property[] = [];

export const MockCurrentUser: UserProfile = {
  id: '',
  fullName: '',
  email: '',
  role: 'user',
  location: '',
  memberSince: '',
  verified: false,
  savedSearchesCount: 0,
  scheduledToursCount: 0,
  inquiriesCount: 0,
  preferences: {
    currency: 'INR',
    notificationsEnabled: false,
    newsletter: false,
    darkMode: false,
  },
};

export const MockAdminUser: UserProfile = {
  id: 'admin-01',
  fullName: 'Administrator',
  email: 'admin@cityspace.in',
  role: 'admin',
  location: '',
  memberSince: '',
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
