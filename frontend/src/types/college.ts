/** College type definition. */

export interface College {
  id: number;
  code: string;
  name: string;
}

export interface PaginatedColleges {
  colleges: College[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}