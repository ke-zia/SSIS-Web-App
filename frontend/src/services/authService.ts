import { apiGet } from "./api";

export interface User {
  id: string;
  email: string;
}

export const getCurrentUser = async (): Promise<User> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    const response = await apiGet<User>("/auth/me");
    return response;
  } catch (error) {
    console.error("Failed to get current user:", error);
    throw error;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
};