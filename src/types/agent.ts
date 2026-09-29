export type AgentStatus = 'active' | 'inactive';

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  email: string;
  designation: string;
  experience: string;
  bio: string;
  areasServed: string[];
  status: AgentStatus;
  rating: number;
  reviewCount: number;
  activeListingsCount?: number;
  propertiesHandled?: number;
  assignedPropertyIds?: string[];
  password?: string;
  city?: string;
  role?: string;
  requiresPasswordChange?: boolean;
  isDefaultPassword?: boolean;
  createdAt: string;
}
