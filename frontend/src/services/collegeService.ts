/** College service for API interactions. */

import { College } from "../types/college";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export async function getAllColleges(
  sortBy?: string,
  order?: "asc" | "desc",
  search?: string,
  searchBy: "all" | "code" | "name" = "all"
): Promise<College[]> {
  const params = new URLSearchParams();
  if (sortBy) {
    params.append("sort_by", sortBy);
    params.append("order", order || "asc");
  }
  if (search) {
    params.append("search", search);
    params.append("search_by", searchBy);
  }
  const queryString = params.toString();
  const url = queryString ? `/colleges?${queryString}` : "/colleges";
  return apiGet<College[]>(url);
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

