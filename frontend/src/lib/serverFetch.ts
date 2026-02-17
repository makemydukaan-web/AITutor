export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function serverFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // VERY IMPORTANT (cookies)
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}
