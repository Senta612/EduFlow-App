export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string | null;
          phone: string | null;
          institute_name: string | null;
          specialization: string | null;
          qualifications: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          phone?: string | null;
          institute_name?: string | null;
          specialization?: string | null;
          qualifications?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          phone?: string | null;
          institute_name?: string | null;
          specialization?: string | null;
          qualifications?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      batches: {
        Row: {
          id: string;
          teacher_id: string | null;
          name: string;
          grade: string;
          subject: string;
          schedule: string;
          timing: string;
          room: string | null;
          student_count: number;
          attendance_taken_today: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          name: string;
          grade: string;
          subject: string;
          schedule: string;
          timing: string;
          room?: string | null;
          student_count?: number;
          attendance_taken_today?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string | null;
          name?: string;
          grade?: string;
          subject?: string;
          schedule?: string;
          timing?: string;
          room?: string | null;
          student_count?: number;
          attendance_taken_today?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          batch_id: string;
          name: string;
          roll_number: string;
          email: string | null;
          parent_phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          name: string;
          roll_number: string;
          email?: string | null;
          parent_phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          name?: string;
          roll_number?: string;
          email?: string | null;
          parent_phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          batch_id: string;
          date: string;
          total_students: number;
          present_count: number;
          absent_count: number;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          date: string;
          total_students?: number;
          present_count?: number;
          absent_count?: number;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          date?: string;
          total_students?: number;
          present_count?: number;
          absent_count?: number;
          submitted_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_items: {
        Row: {
          id: string;
          attendance_record_id: string;
          student_id: string;
          status: 'present' | 'absent';
          created_at: string;
        };
        Insert: {
          id?: string;
          attendance_record_id: string;
          student_id: string;
          status: 'present' | 'absent';
          created_at?: string;
        };
        Update: {
          id?: string;
          attendance_record_id?: string;
          student_id?: string;
          status?: 'present' | 'absent';
          created_at?: string;
        };
        Relationships: [];
      };
      homework_assignments: {
        Row: {
          id: string;
          batch_id: string;
          title: string;
          description: string | null;
          due_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      homework_submissions: {
        Row: {
          id: string;
          homework_id: string;
          student_id: string;
          status: 'done' | 'half_done' | 'not_done';
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          student_id: string;
          status: 'done' | 'half_done' | 'not_done';
          remarks?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          student_id?: string;
          status?: 'done' | 'half_done' | 'not_done';
          remarks?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          batch_id: string;
          title: string;
          date: string;
          max_marks: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          title: string;
          date: string;
          max_marks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          title?: string;
          date?: string;
          max_marks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      test_marks: {
        Row: {
          id: string;
          test_id: string;
          student_id: string;
          marks_obtained: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          marks_obtained?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          student_id?: string;
          marks_obtained?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
