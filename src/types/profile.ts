export type UserRole = 'teacher' | 'student' | 'admin';

export interface Profile {
  id: string;
  email?: string | null;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  institute_name?: string | null;
  specialization?: string | null;
  qualifications?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}