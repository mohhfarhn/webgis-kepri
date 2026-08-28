"use client";

import { API_BASE_URL } from "../lib/api";

const TOKEN_KEY = "admin_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Memberi tahu tab lain (mis. peta yang terbuka) bahwa data cagar budaya berubah,
// agar tab tersebut memuat ulang datanya. Perubahan localStorage memicu event
// `storage` di tab/window lain pada origin yang sama.
export function notifyDataChanged() {
  try {
    localStorage.setItem("webgis_data_version", String(Date.now()));
  } catch {
    // localStorage tidak tersedia — abaikan
  }
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Browser sets the Content-Type boundary automatically for FormData.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
}

// ── Auth ──
export async function loginAdmin(email: string, password: string) {
  const data = await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function getMe() {
  return authFetch("/auth/me");
}

// ── Cagar Budaya CRUD ──
export async function getAllSites() {
  return authFetch("/cagar-budaya");
}

export async function getSiteById(id: number) {
  return authFetch(`/cagar-budaya/id/${id}`);
}

export async function createSite(formData: FormData) {
  return authFetch("/cagar-budaya", { method: "POST", body: formData });
}

export async function updateSite(id: number, formData: FormData) {
  return authFetch(`/cagar-budaya/${id}`, { method: "PUT", body: formData });
}

export async function deleteSite(id: number) {
  return authFetch(`/cagar-budaya/${id}`, { method: "DELETE" });
}

// ── Gallery ──
export async function addGalleryPhoto(cagarId: number, formData: FormData) {
  return authFetch(`/cagar-budaya/${cagarId}/gallery`, { method: "POST", body: formData });
}

export async function deleteGalleryPhoto(cagarId: number, galleryId: number) {
  return authFetch(`/cagar-budaya/${cagarId}/gallery/${galleryId}`, { method: "DELETE" });
}
