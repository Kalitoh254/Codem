const API = window.CODEM_CONFIG.API_BASE;

async function api(path, opt = {}) {
  const token = localStorage.getItem("codem_token");

  const headers = {
    Accept: "application/json",
    ...(opt.headers || {})
  };

  if (!(opt.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000);

try {
    res = await fetch(API + path, {
      ...opt,
      headers,
      signal: controller.signal,
      body:
        opt.body instanceof FormData
          ? opt.body
          : opt.body
            ? JSON.stringify(opt.body)
            : undefined
    });
} catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }

    throw new Error("Unable to connect to Codem server");
} finally {
    clearTimeout(timeout);
}
  } catch {
    throw new Error("Unable to connect to Codem server");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("codem_token");
      localStorage.removeItem("codem_user");
    }

    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed (${res.status})`;

    const err = new Error(message);
    err.status = res.status;
    err.data = data;

    throw err;
  }

  return data;
}

window.CodemAPI = {
  get: (path) => api(path),

  post: (path, body) =>
    api(path, {
      method: "POST",
      body
    }),

  patch: (path, body) =>
    api(path, {
      method: "PATCH",
      body
    }),

  put: (path, body) =>
    api(path, {
      method: "PUT",
      body
    }),

  delete: (path) =>
    api(path, {
      method: "DELETE"
    })
};
