import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
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
      return "Cannot reach backend API. Make sure backend is running on http://localhost:4000.";
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
