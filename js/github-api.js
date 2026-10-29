// ============================================================
// github-api.js — Wrapper GitHub Contents API
// ============================================================
const GH = (() => {
  const CFG_KEY = STORAGE_KEYS.GH_CONFIG;

  // ---------- Config ----------
  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CFG_KEY)) || {};
    } catch {
      return {};
    }
  }

  function setConfig(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  function baseUrl() {
    const { user, repo } = getConfig();
    if (!user || !repo) throw new Error("Chưa cấu hình GitHub (user/repo).");
    return `https://api.github.com/repos/${user}/${repo}/contents`;
  }

  function headers() {
    const { pat } = getConfig();
    if (!pat) throw new Error("Chưa cấu hình PAT.");
    return {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  // ---------- Base64 helpers ----------
  function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64DecodeUnicode(str) {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ""))));
  }
  function arrayBufferToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  // ---------- HTTP ----------
  async function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Token sai hoặc hết quyền.");
    }
  }

  /** GET file. Trả {content, sha} hoặc null nếu chưa tồn tại. */
  async function getFile(path) {
    const { branch } = getConfig();
    const url = `${baseUrl()}/${path}?ref=${branch || "main"}&t=${Date.now()}`;
    const res = await fetch(url, { headers: headers(), cache: "no-store" });

    if (res.status === 404) return null;
    await handleAuthError(res);
    if (!res.ok) throw new Error(`Lỗi GET ${path}: HTTP ${res.status}`);

    const data = await res.json();
    return {
      content: b64DecodeUnicode(data.content || ""),
      sha: data.sha,
      path: data.path
    };
  }

  /** PUT file. Nếu sha == null → tạo mới. */
  async function putFile(path, content, sha, message) {
    const { branch } = getConfig();
    const body = {
      message: message || `Update ${path}`,
      content: b64EncodeUnicode(content),
      branch: branch || "main"
    };
    if (sha) body.sha = sha;

    const doPut = () =>
      fetch(`${baseUrl()}/${path}`, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

    let res = await doPut();

    // Xử lý lỗi 409 (sha conflict) HOẶC 422 (thiếu sha) -> Fetch lại sha mới và retry
    if (res.status === 409 || res.status === 422) {
      const fresh = await getFile(path);
      if (fresh && fresh.sha) {
        body.sha = fresh.sha;
        res = await doPut(); // Thử lại 1 lần
      }
    }

    await handleAuthError(res);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Lỗi PUT ${path}: HTTP ${res.status} ${txt.slice(0, 200)}`);
    }
    return res.json();
  }

  /** DELETE file */
  async function deleteFile(path, sha, message) {
    const { branch } = getConfig();
    const res = await fetch(`${baseUrl()}/${path}`, {
      method: "DELETE",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || `Delete ${path}`,
        sha,
        branch: branch || "main"
      })
    });
    await handleAuthError(res);
    if (!res.ok) throw new Error(`Lỗi DELETE ${path}: HTTP ${res.status}`);
    return res.json();
  }

  /** Upload ảnh lên assets/uploads/{timestamp}-{filename}. */
  async function uploadImage(file) {
    const { user, repo, branch } = getConfig();
    if (!user || !repo) throw new Error("Chưa cấu hình GitHub.");

    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `assets/uploads/${ts}-${safeName}`;

    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);

    const res = await fetch(`${baseUrl()}/${path}`, {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Upload ${safeName}`,
        content: b64,
        branch: branch || "main"
      })
    });
    await handleAuthError(res);
    if (!res.ok) throw new Error(`Lỗi upload: HTTP ${res.status}`);

    const br = branch || "main";
    return `https://raw.githubusercontent.com/${user}/${repo}/${br}/${path}`;
  }

  /** GET repo info — kiểm tra kết nối */
  async function testConnection() {
    const { user, repo } = getConfig();
    if (!user || !repo) throw new Error("Chưa cấu hình user/repo.");
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
      headers: headers()
    });
    await handleAuthError(res);
    if (!res.ok) throw new Error(`Không kết nối được (HTTP ${res.status})`);
    return res.json();
  }

  return {
    getConfig,
    setConfig,
    getFile,
    putFile,
    deleteFile,
    uploadImage,
    testConnection
  };
})();
