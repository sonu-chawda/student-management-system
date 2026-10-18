// All HTTP calls to the Spring Boot backend live here.

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export const TOKEN_KEY = "sms_token";

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || {};
  }
}

function buildUrl(path, params) {
  let url = BASE_URL + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.append(key, value);
      }
    });
    const text = qs.toString();
    if (text) url += "?" + text;
  }
  return url;
}

async function request(path, { method = "GET", body, form, params, auth = true, responseType = "json" } = {}) {
  const headers = {};
  let payload;

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (form) {
    payload = new URLSearchParams(form); // sent as application/x-www-form-urlencoded
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), { method, headers, body: payload });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.", 0);
  }

  if (!response.ok) {
    let message = "";
    let errors = {};
    try {
      const data = await response.json();
      message = data.message || "";
      errors = data.errors || {};
    } catch {
      // response had no JSON body
    }

    if (response.status === 401 && auth) {
      // token expired or invalid: tell AuthContext to log the user out
      window.dispatchEvent(new Event("auth:unauthorized"));
      throw new ApiError("Your session has expired. Please log in again.", 401);
    }
    if (response.status === 403) {
      message = message || "You do not have permission to do that.";
    }
    throw new ApiError(message || `Request failed (${response.status})`, response.status, errors);
  }

  if (response.status === 204) return null;
  if (responseType === "text") return (await response.text()).trim();
  if (responseType === "blob") return response.blob();
  return response.json();
}

export const api = {
  // auth
  login: (username, password) =>
    request("/auth/login", { method: "POST", form: { username, password }, auth: false, responseType: "text" }),
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: { username, password }, auth: false }),

  // students
  searchStudents: (params) => request("/students/search", { params }),
  getStats: () => request("/students/stats"),
  getCourses: () => request("/students/courses"),
  createStudent: (student) => request("/students", { method: "POST", body: student }),
  updateStudent: (id, student) => request(`/students/${id}`, { method: "PUT", body: student }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),
  exportStudents: (params) => request("/students/export", { params, responseType: "blob" }),
};
