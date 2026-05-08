import { UserRole } from './auth';

export interface InviteUserDto {
  full_name: string;
  phone: string;
  email: string;
  password?: string;
  role: UserRole;
  title?: string;
}
