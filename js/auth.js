// ============================================================
// auth.js — Logic Đăng nhập (Plain Text Password)
// ============================================================

const Auth = (() => {
  const SESSION_KEY = "admin_user";
  const ROLE_KEY = "admin_role";

  /**
   * Hàm đăng nhập
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {string} - Quyền của tài khoản (admin / editor)
   */
  function login(username, password) {
    // Kiểm tra xem tài khoản có tồn tại trong file config.js không
    const user = USERS[username];
    if (!user) {
      throw new Error("Tài khoản không tồn tại!");
    }

    // So sánh mật khẩu trực tiếp
    if (user.password !== password) {
      throw new Error("Mật khẩu không chính xác!");
    }

    // Lưu phiên đăng nhập vào sessionStorage
    sessionStorage.setItem(SESSION_KEY, username);
    sessionStorage.setItem(ROLE_KEY, user.role);
    
    return user.role;
  }

  /**
   * Hàm đăng xuất
   */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  }

  /**
   * Kiểm tra xem đã đăng nhập chưa
   * @returns {boolean}
   */
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  }

  /**
   * Lấy quyền của tài khoản đang đăng nhập
   * @returns {string} - "admin" hoặc "editor"
   */
  function getRole() {
    return sessionStorage.getItem(ROLE_KEY);
  }

  // Trả ra các hàm để sử dụng ở file khác
  return { login, logout, isLoggedIn, getRole };
})();
