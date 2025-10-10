/** Student service for API interactions. */

import { Student, PaginatedStudents } from "../types/student";
import { Program } from "../types/program";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export const getAllStudents = async (
  page?: number,
  per_page?: number,
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy: "all" | "id" | "first_name" | "last_name" | "program" | "year_level" | "gender" = "all"
): Promise<PaginatedStudents> => {
  const params = new URLSearchParams();
  
  // Add pagination parameters
  if (page) {
    params.append("page", page.toString());
  }
  if (per_page) {
    params.append("per_page", per_page.toString());
  }
  
  // Add sorting parameters
  if (sortBy) params.append('sort_by', sortBy);
  if (order) params.append('order', order);
  
  // Add search parameters
  if (search) params.append('search', search);
  if (searchBy && searchBy !== 'all') params.append('search_by', searchBy);
  
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