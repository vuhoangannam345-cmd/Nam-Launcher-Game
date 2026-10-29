// ============================================================
// auth.js — Đăng nhập admin (SHA-256 + rate limit)
// ============================================================
const Auth = (() => {
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 60 * 1000; // 60 giây

  /** Hash SHA-256 của chuỗi (Web Crypto) */
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Lấy state khóa (lưu cả 2 nơi để chống F5 đổi tab)
  function getLockState() {
    try {
      const raw =
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_LOCK) ||
        localStorage.getItem(STORAGE_KEYS.ADMIN_LOCK);
      return raw ? JSON.parse(raw) : { until: 0, attempts: 0 };
    } catch {
      return { until: 0, attempts: 0 };
    }
  }

  function setLockState(state) {
    const raw = JSON.stringify(state);
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_LOCK, raw);
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOCK, raw);
  }

  /**
   * Đăng nhập. Throw Error nếu sai/khóa.
   * Trả về true nếu thành công.
   */
  async function login(password) {
    const now = Date.now();
    const state = getLockState();

    // Đang bị khóa?
    if (state.until > now) {
      const left = Math.ceil((state.until - now) / 1000);
      throw new Error(`Tài khoản đang bị khóa. Thử lại sau ${left}s.`);
    }

    const hash = await sha256(password);

    if (hash === ADMIN_PASSWORD_HASH) {
      // Reset state
      setLockState({ until: 0, attempts: 0 });
      sessionStorage.setItem(
        STORAGE_KEYS.ADMIN_SESSION,
        JSON.stringify({ loggedIn: true, at: now })
      );
      return true;
    }

    // Sai → tăng đếm
    const attempts = state.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      setLockState({ until: now + LOCK_MS, attempts: 0 });
      throw new Error(`Sai ${MAX_ATTEMPTS} lần liên tiếp. Tài khoản bị khóa 60 giây.`);
    }
    setLockState({ until: 0, attempts });
    throw new Error(`Sai mật khẩu (${attempts}/${MAX_ATTEMPTS}).`);
  }

  /** Đăng xuất */
  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }

  /** Kiểm tra đã đăng nhập chưa */
  function isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data && data.loggedIn === true;
    } catch {
      return false;
    }
  }

  return { sha256, login, logout, isLoggedIn };
})();
