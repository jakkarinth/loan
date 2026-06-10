import { getSession, signOut } from "next-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiOptions = RequestInit & {
  token?: string | null;
  skipAuth?: boolean;
};

export async function getAccessToken() {
  if (typeof window === "undefined") return null;
  const session = await getSession();
  return session?.accessToken ?? null;
}

export async function clearAuthSession() {
  await signOut({ callbackUrl: "/login" });
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

async function handleUnauthorized(skipAuth: boolean) {
  if (skipAuth) return;
  await signOut({ redirect: false });
  redirectToLogin();
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, skipAuth = false, headers, ...rest } = options;
  const authToken = skipAuth ? null : token ?? await getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    cache: "no-store"
  });

  if (response.status === 401) {
    await handleUnauthorized(skipAuth);
  }

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      message = errorBody.message ?? message;
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function downloadAuthenticated(path: string, fileName: string) {
  const token = await getAccessToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401) {
    await handleUnauthorized(false);
    return;
  }

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export type ApiListResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ApiDataResponse<T> = {
  data: T;
};
