/** Program service for API interactions. */

import { Program } from "../types/program";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export const getAllPrograms = async (
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy: "all" | "code" | "name" | "college" = "all"
): Promise<Program[]> => {
  const params = new URLSearchParams();
  
  if (sortBy) params.append('sort_by', sortBy);
  if (order) params.append('order', order);
  if (search) params.append('search', search);
  if (searchBy && searchBy !== 'all') params.append('search_by', searchBy);
  
  // Use apiGet instead of api.get
  const response = await apiGet<Program[]>(`/programs?${params.toString()}`);
  return response;
};

export async function createProgram(
  data: { college_id: number; code: string; name: string }
): Promise<Program> {
  return apiPost<Program>("/programs", data);
}

export async function updateProgram(
  id: number,
  data: { college_id?: number; code?: string; name?: string }
): Promise<Program> {
  return apiPut<Program>(`/programs/${id}`, data);
}

export async function deleteProgram(id: number): Promise<void> {
  return apiDelete<void>(`/programs/${id}`);
}