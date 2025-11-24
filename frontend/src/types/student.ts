export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  program_id: number | null;
  program_name: string;
  program_code: string;
  year_level: number;
  gender: string;
  // optional stored photo path (Supabase storage path) and computed public URL
  photo?: string | null;
  photo_url?: string | null;
}

export interface PaginatedStudents {
  students: Student[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}