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
  searchBy: "all" | "id" | "first_name" | "last_name" | "program" | "year_level" | "gender" = "all"
): Promise<PaginatedStudents> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (per_page) params.append("per_page", per_page.toString());
  if (sortBy) params.append("sort_by", sortBy);
  if (order) params.append("order", order);
  if (search) params.append("search", search);
  if (searchBy && searchBy !== "all") params.append("search_by", searchBy);

  const response = await apiGet<PaginatedStudents>(`/students?${params.toString()}`);
  return response;
};

/**
 * Create a student via backend API (trusted write).
 * The student payload may include photo (storage path string) returned by uploadStudentPhoto.
 */
export const createStudent = async (student: Omit<Student, "program_name">): Promise<Student> => {
  return apiPost<Student>("/students", student);
};

/**
 * Update a student via backend API (trusted write).
 * Partial student allowed. Use photo: "" to request removal.
 */
export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  return apiPut<Student>(`/students/${id}`, student);
};

/**
 * Delete a student via backend API.
 */
export const deleteStudent = async (id: string): Promise<void> => {
  return apiDelete<void>(`/students/${id}`);
};

/**
 * Get programs for a college (used by the Add/Edit student form).
 */
export const getProgramsByCollege = async (collegeId: number): Promise<Program[]> => {
  return apiGet<Program[]>(`/students/programs/${collegeId}`);
};

/**
 * Upload student photo to server endpoint which uses Supabase service role.
 * Returns { path, publicUrl } where path is the storage key to store in DB
 * and publicUrl is a URL suitable for display.
 *
 * This sends the file to the backend API at /students/upload-photo which performs
 * the upload using the SUPABASE_SERVICE_ROLE_KEY. This avoids client-side RLS issues.
 */
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

  // POST to backend endpoint; apiPostForm will send credentials (cookies) and headers as configured
  const response = await apiPostForm<{ path: string; publicUrl: string }>(`/students/upload-photo`, formData);
  return response;
}

/**
 * Delete a photo from Supabase storage by storage path.
 * Path must match what was previously stored in DB (e.g., "student_photos/uuid.jpg").
 * This is useful if you want to delete an old file from frontend (but prefer server-side deletion).
 *
 * NOTE: Keep this for compatibility. Frontend delete currently calls Supabase directly;
 * you may prefer to call a server endpoint for deletion as well (safer).
 */
export async function deleteStudentPhoto(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
  if (error) {
    console.error("Supabase delete error:", error);
    throw new Error(error.message || "Failed to delete photo.");
  }
}

/**
 * Get public URL for a stored photo path; returns default placeholder when path falsy.
 * Make sure the DEFAULT points to a valid asset under frontend/public.
 */
export function getPhotoPublicUrl(path?: string | null): string {
  const DEFAULT = (import.meta.env.VITE_DEFAULT_AVATAR_URL as string) || "/default-avatar.png";
  if (!path) return DEFAULT;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path) as any;
  return data?.publicUrl || DEFAULT;
}