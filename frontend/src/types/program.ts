/** Program type definition. */

export interface Program {
  id: number;
  college_id: number | null;
  college_name: string;
  college_code: string;
  code: string;
  name: string;
}

export interface PaginatedPrograms {
  programs: Program[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}