import { UserResponse } from './auth';

export interface Member extends UserResponse {
  role?: string;
  last_login?: string;
}

export interface AddMemberResponse {
  id: string;
  email: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface MemberError {
  error: string;
  detail?: string;
} 