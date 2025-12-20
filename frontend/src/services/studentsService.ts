/** Student service for API interactions. */

import { Student, PaginatedStudents } from "../types/student";
import { Program } from "../types/program";
import { apiDelete, apiGet, apiPost, apiPut, apiPostForm } from "./api";
import { supabase, SUPABASE_BUCKET } from "../lib/supabase";

/**
 * Fetch paginated students from backend API.
 */
export const getAllStudents = async (
  page?: number,
  per_page?: number,
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy: "all" | "id" | "first_name" | "last_name" | "program" | "year_level" | "gender" = "all",
  programCode?: string,
  yearLevel?: number,
  gender?: string
): Promise<PaginatedStudents> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (per_page) params.append("per_page", per_page.toString());
  if (sortBy) params.append("sort_by", sortBy);
  if (order) params.append("order", order);
  if (search) params.append("search", search);
  if (searchBy && searchBy !== "all") params.append("search_by", searchBy);

  // Append filter params when provided
  if (programCode && programCode !== "all") params.append("program_code", programCode);
  if (typeof yearLevel !== "undefined" && yearLevel !== null) params.append("year_level", String(yearLevel));
  if (gender && gender !== "all") params.append("gender", gender);

  const response = await apiGet<PaginatedStudents>(`/students?${params.toString()}`);
  return response;
};

export const createStudent = async (student: Omit<Student, "program_name">): Promise<Student> => {
  return apiPost<Student>("/students", student);
};

export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  return apiPut<Student>(`/students/${id}`, student);
};

export const deleteStudent = async (id: string): Promise<void> => {
  return apiDelete<void>(`/students/${id}`);
};

export const getProgramsByCollege = async (collegeId: number): Promise<Program[]> => {
  return apiGet<Program[]>(`/students/programs/${collegeId}`);
};

export async function uploadStudentPhoto(file: File): Promise<{ path: string; publicUrl: string }> {
  if (!file) throw new Error("No file provided");

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_BYTES) {
    throw new Error("File size exceeds 5 MB limit.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const formData = new FormData();
  formData.append("photo", file);

  const response = await apiPostForm<{ path: string; publicUrl: string }>(`/students/upload-photo`, formData);
  return response;
}

export async function deleteStudentPhoto(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
  if (error) {
    console.error("Supabase delete error:", error);
    throw new Error(error.message || "Failed to delete photo.");
  }
}

export function getPhotoPublicUrl(path?: string | null): string {
  const DEFAULT = (import.meta.env.VITE_DEFAULT_AVATAR_URL as string) || "/default-avatar.png";
  if (!path) return DEFAULT;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path) as any;
  return data?.publicUrl || DEFAULT;
}