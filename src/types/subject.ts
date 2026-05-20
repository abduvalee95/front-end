export interface Subject {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
}

export interface CreateSubjectPayload {
  name: string;
}

export interface UpdateSubjectPayload {
  name: string;
}
