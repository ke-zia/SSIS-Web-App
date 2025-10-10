/** College service for API interactions. */

import { College, PaginatedColleges } from "../types/college";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export async function getAllColleges(
  page?: number,
  per_page?: number,
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy?: "all" | "code" | "name"
): Promise<PaginatedColleges> {
  const params = new URLSearchParams();
  
  // Add pagination parameters
  if (page) {
    params.append("page", page.toString());
  }
  if (per_page) {
    params.append("per_page", per_page.toString());
  }
  
  // Add sorting parameters
  if (sortBy) {
    params.append("sort_by", sortBy);
    params.append("order", order || "asc");
  }
  
  // Add search parameters
  if (search) {
    params.append("search", search);
    params.append("search_by", searchBy || "all");
  }
  
  const queryString = params.toString();
  const url = queryString ? `/colleges?${queryString}` : "/colleges";
  return apiGet<PaginatedColleges>(url);
}

export async function createCollege(
  data: { code: string; name: string }
): Promise<College> {
  return apiPost<College>("/colleges", data);
}

export async function updateCollege(
  id: number,
  data: { code: string; name: string }
): Promise<College> {
  return apiPut<College>(`/colleges/${id}`, data);
}

export async function deleteCollege(id: number): Promise<void> {
  return apiDelete<void>(`/colleges/${id}`);
}