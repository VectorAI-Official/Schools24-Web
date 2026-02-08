import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function fetchClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem("School24_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Debug logging (remove in production)
  if (typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
    console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    });
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Debug log responses for student list
    if (endpoint.includes('/students-list') && typeof window !== 'undefined') {
      console.log(`[API Response] ${endpoint}:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
    }

    // Handle 401 Unauthorized (Logout)
    // Skip for login endpoint to allow handling invalid credentials
    if (response.status === 401 && !endpoint.includes("/auth/login")) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("School24_token");
        localStorage.removeItem("School24_user");
        // Temporarily disabled to see the error overlay
        /*
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        */
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    
    // Debug log student list data
    if (endpoint.includes('/students-list') && typeof window !== 'undefined') {
      console.log(`[API Data] ${endpoint}:`, {
        students: data.students?.length || 0,
        total: data.total,
        firstStudent: data.students?.[0]
      });
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    // Don't toast here to allow custom error handling, or toast generic?
    // Let's toast generic network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      toast.error("Network Error", { description: "Could not connect to server." });
    }
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) => fetchClient<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: any, options?: FetchOptions) => fetchClient<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any, options?: FetchOptions) => fetchClient<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: FetchOptions) => fetchClient<T>(endpoint, { ...options, method: "DELETE" }),
  patch: <T>(endpoint: string, body: any, options?: FetchOptions) => fetchClient<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
};
