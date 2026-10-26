const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Support fallback token if stored
  const token = localStorage.getItem("entp_token");
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: "include", // For HttpOnly cookie
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  // If response is a file download (like CSV export)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    if (!response.ok) {
      throw new Error("Failed to export data file");
    }
    const blob = await response.blob();
    return blob;
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = { success: response.ok, message: response.statusText };
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
};
