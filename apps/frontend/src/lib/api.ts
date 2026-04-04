import axios from "axios";

const getBackendBaseUrl = (): string => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl) {
    const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(configuredUrl);
    if (typeof window === "undefined" || !isLocalhostUrl) {
      return configuredUrl;
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return "http://localhost:4000";
};

export const api = axios.create({
  baseURL: getBackendBaseUrl()
});

export const setAuthToken = (token: string | null) => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

type ValidationIssues = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
  issues?: ValidationIssues;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (!error.response) {
      return "Cannot reach backend API. Make sure backend is running and reachable on port 4000.";
    }

    const data = error.response.data;
    if (data?.message) {
      return data.message;
    }
    if (data?.error) {
      if (data.error === "Validation failed" && data.issues?.fieldErrors) {
        const firstFieldErrors = Object.values(data.issues.fieldErrors)
          .flat()
          .filter((msg): msg is string => Boolean(msg));
        if (firstFieldErrors.length > 0) {
          return firstFieldErrors[0];
        }
      }
      return data.error;
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
