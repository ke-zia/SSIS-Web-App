/** Base API utility functions. */

// Use window.location for dynamic API URL, defaulting to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (() => {
  // In development, use localhost:5000
  // In production, use the same origin as the frontend
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://127.0.0.1:5000/api"; // Use 127.0.0.1 instead of localhost
  }
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
})();

export interface ApiError {
  message: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(errorData.message || "An error occurred");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

const fetchOptions = {
  credentials: "include" as const,
};

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
      ...fetchOptions,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to server. Is the backend running on http://localhost:5000?");
    }
    throw error;
  }
}

export async function apiPost<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  try {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      ...fetchOptions,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to server. Is the backend running on http://localhost:5000?");
    }
    throw error;
  }
}

export async function apiPut<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    ...fetchOptions,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    ...fetchOptions,
  });

  return handleResponse<T>(response);
}

/**
 * Post FormData (multipart/form-data) to endpoint.
 * Removes the Content-Type header so the browser sets the correct boundary.
 */
export async function apiPostForm<T>(endpoint: string, formData: FormData): Promise<T> {
  try {
    const headers = { ...getAuthHeaders() };
    // Let the browser set the multipart/form-data Content-Type with boundary
    delete headers["Content-Type"];

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to server. Is the backend running on http://localhost:5000?");
    }
    throw error;
  }
}

/**
 * Put FormData (multipart/form-data) to endpoint.
 * Removes the Content-Type header so the browser sets the correct boundary.
 */
export async function apiPutForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const headers = { ...getAuthHeaders() };
  delete headers["Content-Type"];

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers,
    body: formData,
    ...fetchOptions,
  });

  return handleResponse<T>(response);
}