export type UserRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  institute_name?: string;
  specialization?: string;
  qualifications?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}