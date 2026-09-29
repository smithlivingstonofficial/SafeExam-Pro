export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "examiner" | "proctor" | "candidate" | "viewer";

export type QuestionType =
  | "mcq_single"
  | "mcq_multiple"
  | "true_false"
  | "fill_blank"
  | "numerical"
  | "descriptive"
  | "coding";

export type ExamStatus = "draft" | "published" | "archived";
export type ScheduleStatus = "scheduled" | "active" | "completed" | "cancelled";
export type WindowType = "fixed" | "flexible";
export type ProctoringLevel = "none" | "basic" | "standard" | "full";
export type AssignmentStatus = "assigned" | "started" | "submitted" | "graded" | "absent";
export type ResultStatus = "draft" | "reviewed" | "published";

export interface Database {
  public: {
    Tables: {
      university_settings: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          department: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          department?: string | null;
          is_active?: boolean;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          head_name: string | null;
          contact_email: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          head_name?: string | null;
          contact_email?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          code?: string | null;
          head_name?: string | null;
          contact_email?: string | null;
          description?: string | null;
        };
        Relationships: [];
      };
      question_banks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          bank_id: string;
          created_by: string | null;
          type: QuestionType;
          content: Json;
          options: Json;
          correct_answer: Json;
          explanation: string | null;
          subject: string;
          topic: string | null;
          sub_topic: string | null;
          difficulty: number;
          bloom_level: string | null;
          tags: string[];
          version: number;
          media_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_id: string;
          created_by?: string | null;
          type: QuestionType;
          content: Json;
          options?: Json;
          correct_answer?: Json;
          explanation?: string | null;
          subject: string;
          topic?: string | null;
          sub_topic?: string | null;
          difficulty?: number;
          bloom_level?: string | null;
          tags?: string[];
          version?: number;
          media_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: QuestionType;
          content?: Json;
          options?: Json;
          correct_answer?: Json;
          explanation?: string | null;
          subject?: string;
          topic?: string | null;
          sub_topic?: string | null;
          difficulty?: number;
          bloom_level?: string | null;
          tags?: string[];
          version?: number;
          media_urls?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          instructions: string | null;
          status: ExamStatus;
          settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          instructions?: string | null;
          status?: ExamStatus;
          settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          instructions?: string | null;
          status?: ExamStatus;
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      exam_sections: {
        Row: {
          id: string;
          exam_id: string;
          title: string;
          order_index: number;
          time_limit_minutes: number | null;
          marking_scheme: Json;
          selection_rules: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          title: string;
          order_index: number;
          time_limit_minutes?: number | null;
          marking_scheme?: Json;
          selection_rules?: Json;
          created_at?: string;
        };
        Update: {
          title?: string;
          order_index?: number;
          time_limit_minutes?: number | null;
          marking_scheme?: Json;
          selection_rules?: Json;
        };
        Relationships: [];
      };
      exam_section_questions: {
        Row: {
          id: string;
          section_id: string;
          question_id: string;
          order_index: number;
          marks: number;
        };
        Insert: {
          id?: string;
          section_id: string;
          question_id: string;
          order_index: number;
          marks?: number;
        };
        Update: {
          section_id?: string;
          question_id?: string;
          order_index?: number;
          marks?: number;
        };
        Relationships: [];
      };
      exam_schedules: {
        Row: {
          id: string;
          exam_id: string;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          window_type: WindowType;
          max_candidates: number | null;
          proctoring_level: ProctoringLevel;
          status: ScheduleStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          window_type?: WindowType;
          max_candidates?: number | null;
          proctoring_level?: ProctoringLevel;
          status?: ScheduleStatus;
          created_at?: string;
        };
        Update: {
          start_at?: string;
          end_at?: string;
          duration_minutes?: number;
          window_type?: WindowType;
          max_candidates?: number | null;
          proctoring_level?: ProctoringLevel;
          status?: ScheduleStatus;
        };
        Relationships: [];
      };
      exam_assignments: {
        Row: {
          id: string;
          schedule_id: string;
          candidate_id: string;
          status: AssignmentStatus;
          assigned_at: string;
          started_at: string | null;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          candidate_id: string;
          status?: AssignmentStatus;
          assigned_at?: string;
          started_at?: string | null;
          submitted_at?: string | null;
        };
        Update: {
          status?: AssignmentStatus;
          started_at?: string | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      exam_responses: {
        Row: {
          id: string;
          assignment_id: string;
          question_id: string;
          response: Json;
          is_flagged: boolean;
          time_spent_seconds: number;
          saved_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          question_id: string;
          response: Json;
          is_flagged?: boolean;
          time_spent_seconds?: number;
          saved_at?: string;
        };
        Update: {
          response?: Json;
          is_flagged?: boolean;
          time_spent_seconds?: number;
          saved_at?: string;
        };
        Relationships: [];
      };
      exam_results: {
        Row: {
          id: string;
          assignment_id: string;
          total_score: number;
          max_score: number;
          percentage: number;
          percentile: number | null;
          section_scores: Json;
          status: ResultStatus;
          graded_by: string | null;
          graded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          total_score: number;
          max_score: number;
          percentage: number;
          percentile?: number | null;
          section_scores?: Json;
          status?: ResultStatus;
          graded_by?: string | null;
          graded_at?: string | null;
          created_at?: string;
        };
        Update: {
          total_score?: number;
          max_score?: number;
          percentage?: number;
          percentile?: number | null;
          section_scores?: Json;
          status?: ResultStatus;
          graded_by?: string | null;
          graded_at?: string | null;
        };
        Relationships: [];
      };
      proctoring_sessions: {
        Row: {
          id: string;
          assignment_id: string;
          recording_url: string | null;
          screenshots: Json;
          flags: Json;
          risk_score: number;
          proctor_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          recording_url?: string | null;
          screenshots?: Json;
          flags?: Json;
          risk_score?: number;
          proctor_notes?: string | null;
          created_at?: string;
        };
        Update: {
          recording_url?: string | null;
          screenshots?: Json;
          flags?: Json;
          risk_score?: number;
          proctor_notes?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          read_at: string | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          read_at?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      question_type: QuestionType;
      exam_status: ExamStatus;
      schedule_status: ScheduleStatus;
      window_type: WindowType;
      proctoring_level: ProctoringLevel;
      assignment_status: AssignmentStatus;
      result_status: ResultStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
