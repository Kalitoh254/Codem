window.CodemAuth = {
  user() {
    try {
      return JSON.parse(localStorage.getItem("codem_user") || "null");
    } catch {
      return null;
    }
  },

  token() {
    return localStorage.getItem("codem_token");
  },

  loggedIn() {
    return !!this.token();
  },

  save(token, user) {
    if (token) localStorage.setItem("codem_token", token);
    if (user) localStorage.setItem("codem_user", JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem("codem_token");
    localStorage.removeItem("codem_user");
  },

  logout() {
    this.clear();
    location.hash = "#/login";
  }
};

CodemAuth.isAuthenticated = CodemAuth.loggedIn;
