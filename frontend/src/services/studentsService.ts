/** Student service for API interactions. */

import { Student } from "../types/student";
import { Program } from "../types/program";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export const getAllStudents = async (
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy: "all" | "id" | "name" | "program" | "gender" = "all"
): Promise<Student[]> => {
  const params = new URLSearchParams();
  
  if (sortBy) params.append('sort_by', sortBy);
  if (order) params.append('order', order);
  if (search) params.append('search', search);
  if (searchBy && searchBy !== 'all') params.append('search_by', searchBy);
  
  const response = await apiGet<Student[]>(`/students?${params.toString()}`);
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