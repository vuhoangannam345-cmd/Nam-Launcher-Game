// ============================================================
// auth.js — Đăng nhập admin (So sánh trực tiếp)
// ============================================================
const Auth = (() => {
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 60 * 1000; 

  function getLockState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_LOCK) || localStorage.getItem(STORAGE_KEYS.ADMIN_LOCK);
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

  async function login(password) {
    const now = Date.now();
    const state = getLockState();

    // Đang bị khóa?
    if (state.until > now) {
      const left = Math.ceil((state.until - now) / 1000);
      throw new Error(`Tài khoản đang bị khóa. Thử lại sau ${left}s.`);
    }

    // SO SÁNH TRỰC TIẾP CHỮ (Không qua hash)
    if (password.trim() === ADMIN_PASSWORD_HASH) {
      setLockState({ until: 0, attempts: 0 });
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify({ loggedIn: true, at: now }));
      return true;
    }

    const attempts = state.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      setLockState({ until: now + LOCK_MS, attempts: 0 });
      throw new Error(`Sai ${MAX_ATTEMPTS} lần liên tiếp. Tài khoản bị khóa 60 giây.`);
    }
    setLockState({ until: 0, attempts });
    throw new Error(`Sai mật khẩu (${attempts}/${MAX_ATTEMPTS}).`);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }

  function isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      return raw ? JSON.parse(raw).loggedIn === true : false;
    } catch {
      return false;
    }
  }

  return { login, logout, isLoggedIn };
})();
