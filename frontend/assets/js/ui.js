window.CodemUI = {
  toast(msg, type = "default") {
    const t = document.createElement("div");

    t.className = `codem-toast codem-toast-${type}`;
    t.textContent = msg;

    document.body.appendChild(t);

    requestAnimationFrame(() => {
      t.classList.add("show");
    });

    setTimeout(() => {
      t.classList.remove("show");

      setTimeout(() => {
        t.remove();
      }, 250);
    }, 2500);
  },

  loading(message = "Loading...") {
    return `
      <div class="codem-loading">
        ${this.escape(message)}
      </div>
    `;
  },

  empty(message = "Nothing here yet.") {
    return `
      <div class="codem-empty">
        <p>${this.escape(message)}</p>
      </div>
    `;
  },

  error(message = "Something went wrong.") {
    return `
      <div class="codem-error">
        <p>${this.escape(message)}</p>
      </div>
    `;
  },

  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  initials(name = "Developer") {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || "")
      .join("");
  }
};
