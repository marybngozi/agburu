const API_BASE = "http://localhost:3010/api";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isMultipart) headers["Content-Type"] = "application/json";
  return headers;
};

export const api = {
  // Auth
  login: (credentials) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }).then((r) => r.json()),

  // People
  getPeople: (params = "") =>
    fetch(`${API_BASE}/people?${params}`).then((r) => r.json()),
  getRootPerson: () => fetch(`${API_BASE}/people/root`).then((r) => r.json()),
  getPersonById: (id) =>
    fetch(`${API_BASE}/people/${id}`).then((r) => r.json()),
  getPeopleByIds: (ids) =>
    fetch(`${API_BASE}/people/by-ids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()),

  // Admin Mutations
  createPerson: (formData) =>
    fetch(`${API_BASE}/people`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    }).then((r) => r.json()),

  updatePerson: (id, formData) =>
    fetch(`${API_BASE}/people/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: formData,
    }).then((r) => r.json()),

  softDelete: (id, isDeleted) =>
    fetch(`${API_BASE}/people/${id}/soft-delete`, {
      method: "PATCH",
      headers: getHeaders(false),
      body: JSON.stringify({ isDeleted }),
    }).then((r) => r.json()),
};
