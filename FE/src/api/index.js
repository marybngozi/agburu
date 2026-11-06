import { isServerWaking } from "@/composables/useNotifications";

// Vite only inlines env vars prefixed VITE_ into the client bundle, and only
// reads them at build time — so the deployed frontend needs VITE_API_BASE
// set in its hosting platform's build-time env vars (e.g. Cloudflare Pages),
// pointing at the deployed backend's URL. Falls back to the local Express
// dev server so `npm run dev` keeps working unconfigured.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3010/api";

// How long a request may be pending before we assume the backend is
// cold-starting (free hosting tiers put idle servers to sleep) and tell the
// visitor, instead of leaving them on a silent spinner.
const SLOW_REQUEST_MS = 3500;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized = null;
// Registered once in main.js: called when a request that carried a token is
// rejected with 401 (expired/revoked session) so the app can sign the user out.
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

let wakeTimer = null;
const startSlowTimer = () => {
  if (wakeTimer) return;
  wakeTimer = setTimeout(() => {
    isServerWaking.value = true;
  }, SLOW_REQUEST_MS);
};
const clearSlowTimer = () => {
  clearTimeout(wakeTimer);
  wakeTimer = null;
  isServerWaking.value = false;
};

const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

// One place for every call: attaches the token, turns failures into thrown
// ApiErrors carrying the server's message (the old code returned error JSON
// as if it were data, so most callers silently ignored failures), and
// handles expired sessions. A stale token on a public read is dropped and
// the read retried anonymously, so an expired login never breaks public pages.
async function request(path, { method = "GET", body, multipart = false, retryAnonymously = false } = {}, token = getToken()) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";

  startSlowTimer();
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    });
  } catch {
    clearSlowTimer();
    throw new ApiError("Can't reach the server. Check your connection and try again.");
  }
  clearSlowTimer();

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body — handled below via response.ok.
  }

  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith("/auth/")) {
      onUnauthorized?.();
      if (retryAnonymously) return request(path, { method, body, multipart }, null);
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
    throw new ApiError(data?.message || `Something went wrong (${response.status})`, response.status);
  }
  return data;
}

const post = (path, body) => request(path, { method: "POST", body });
const patch = (path, body) => request(path, { method: "PATCH", body });

export const api = {
  // Auth
  login: (credentials) => post("/auth/login", credentials),
  signup: (data) => post("/auth/signup", data),

  // People
  getPeople: (params = "") => request(`/people?${params}`),
  getPersonById: (idOrSlug) =>
    request(`/people/${encodeURIComponent(idOrSlug)}`, { retryAnonymously: true }),
  getPeopleByIds: (ids) =>
    request("/people/by-ids", { method: "POST", body: { ids }, retryAnonymously: true }),

  // Lineages
  getLineageTree: (slug) =>
    request(`/lineages/${encodeURIComponent(slug)}/tree`, { retryAnonymously: true }),
  getLineages: () => request("/lineages"),
  requestLineage: (data) => post("/lineages", data),
  getAdminLineages: () => request("/lineages/admin/all"),
  getMyLineages: () => request("/lineages/mine"),
  approveLineage: (id) => patch(`/lineages/admin/${id}/approve`),
  getLineageMembers: (lineageId) => request(`/lineages/${lineageId}/members`),
  addLineageMember: (lineageId, personId, modeOfJoining) =>
    post(`/lineages/${lineageId}/members`, { personId, modeOfJoining }),
  setLineageRoot: (lineageId, memberId) =>
    patch(`/lineages/${lineageId}/members/${memberId}/root`),
  createRelationship: (lineageId, data) => post(`/lineages/${lineageId}/relationships`, data),
  reorderChildren: (lineageId, parentPersonId, childIds) =>
    patch(`/lineages/${lineageId}/parents/${parentPersonId}/children-order`, { childIds }),

  // Profile editors / change requests
  createProfileEditor: (data) => post("/users/profile-editors", data),
  getPendingChanges: () => request("/users/change-requests/pending"),
  reviewChange: (id, approved) => patch(`/users/change-requests/${id}`, { approved }),

  // Person mutations
  createPerson: (formData) => request("/people", { method: "POST", body: formData, multipart: true }),
  updatePerson: (id, formData) =>
    request(`/people/${id}`, { method: "PUT", body: formData, multipart: true }),
  softDelete: (id, isDeleted) => patch(`/people/${id}/soft-delete`, { isDeleted }),
};
