import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!API_BASE_URL && typeof window !== "undefined") {
  console.error(
    "[Schools24] NEXT_PUBLIC_API_URL is not set. API calls will fail. " +
    "Set this environment variable to your backend URL (e.g., https://your-app.onrender.com/api/v1)"
  );
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const STORAGE_KEYS = {
  TOKEN: "School24_token",
  REMEMBER: "School24_remember",
  USER: "School24_user",
  EXPIRY: "School24_token_expiry",
} as const;

const getAuthStorage = (): Storage => {
  if (typeof window === "undefined") return localStorage;
  const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === "true";
  return remembered ? localStorage : sessionStorage;
};

const clearAuthData = () => {
  [localStorage, sessionStorage].forEach((storage) => {
    Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  });
  // Also clear the middleware cookie
  document.cookie = "School24_token=; path=/; max-age=0";
};

// Custom error class for validation errors (won't trigger Next.js error overlay)
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function fetchClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API URL is not configured. Set NEXT_PUBLIC_API_URL environment variable.");
  }

  const token = typeof window !== "undefined"
    ? getAuthStorage().getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized — clear auth and redirect to login
    if (response.status === 401 && !endpoint.includes("/auth/login")) {
      if (typeof window !== "undefined") {
        clearAuthData();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;

      // Use ValidationError for 4xx errors (client/validation errors)
      if (response.status >= 400 && response.status < 500) {
        throw new ValidationError(errorMessage);
      }

      // Use regular Error for 5xx server errors
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    // Only log unexpected errors (not validation errors)
    if (!(error instanceof ValidationError)) {
      console.error(`API Error [${endpoint}]:`, error);
    }
    // Toast network errors
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
