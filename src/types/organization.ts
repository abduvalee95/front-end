export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  adminEmail?: string;
  adminPhone?: string;
}

export interface OrganizationListResponse {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrganizationFormData {
  name: string;
  domain?: string;
  adminEmail?: string;
  adminPhone?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  status: OrganizationStatus;
}
