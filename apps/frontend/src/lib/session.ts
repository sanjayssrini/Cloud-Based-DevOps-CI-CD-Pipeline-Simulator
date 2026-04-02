import { setAuthToken } from "./api";

const ACCESS_KEY = "sim_access_token";
const USER_KEY = "sim_user";

type SessionUser = {
  id: string;
  name: string;
  role: string;
};

export const saveSession = (accessToken: string, user: SessionUser) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthToken(accessToken);
};

export const loadSession = (): { accessToken: string | null; user: SessionUser | null } => {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null };
  }

  const accessToken = localStorage.getItem(ACCESS_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  const user = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;

  setAuthToken(accessToken);
  return { accessToken, user };
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(USER_KEY);
  setAuthToken(null);
};
