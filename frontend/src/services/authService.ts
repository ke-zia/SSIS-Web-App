/** Frontend auth helpers (modified logout to redirect). */

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

/**
 * Clear local auth state and redirect to the login page.
 * This enforces that the only way to return to the login page is via Logout.
 */
export const logout = (): void => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    // Optionally clear any other auth-related storage/cookies here.

    // Force navigation to login (explicit redirect ensures any protected UI
    // is replaced and prevents back-navigation showing login page while still
    // authenticated in client storage).
    window.location.href = "/login";
  } catch (e) {
    console.error("Error during logout:", e);
    window.location.href = "/login";
  }
};