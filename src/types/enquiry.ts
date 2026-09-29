export type EnquiryStatus = 'new' | 'contacted' | 'follow_up' | 'converted' | 'closed';

export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'interested' | 'site_visit' | 'negotiation' | 'closed' | 'lost';

export type PreferredContactMethod = 'phone' | 'whatsapp' | 'email';

export interface PropertyEnquiry {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyCity?: string;
  propertySlug?: string;
  visitorName: string;
  phone: string;
  email?: string;
  message: string;
  preferredContactMethod?: PreferredContactMethod;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  status: EnquiryStatus;
  pipelineStage?: PipelineStage;
  buyerBudget?: string;
  buyerLocation?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt?: string;
}
