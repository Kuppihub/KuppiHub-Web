// src/lib/auth-fetch.ts
// Client-side utility for making authenticated API requests

import { auth } from "./firebase";

/**
 * Get the current user's Firebase ID token
 * Returns null if user is not authenticated
 */
export async function getIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  try {
    // Force refresh to ensure token is valid
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
}

/**
 * Make an authenticated fetch request
 * Automatically includes the Firebase ID token in the Authorization header
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();

  if (!token) {
    throw new Error("Not authenticated. Please log in and try again.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for making authenticated POST requests
 */
export async function authPost<T = unknown>(
  url: string,
  body: T
): Promise<Response> {
  return authFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Helper for making authenticated PUT requests
 */
export async function authPut<T = unknown>(
  url: string,
  body: T
): Promise<Response> {
  return authFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Helper for making authenticated PATCH requests
 */
export async function authPatch<T = unknown>(
  url: string,
  body: T
): Promise<Response> {
  return authFetch(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Helper for making authenticated GET requests
 */
export async function authGet(url: string): Promise<Response> {
  return authFetch(url, {
    method: "GET",
  });
}

/**
 * Helper for making authenticated DELETE requests
 */
export async function authDelete(url: string): Promise<Response> {
  return authFetch(url, {
    method: "DELETE",
  });
}

/**
 * Fetch that attaches a Bearer token when the user is signed in.
 * Useful for public endpoints that optionally apply auth-based access control.
 */
export async function optionalAuthFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
