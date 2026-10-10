// Presentation only: require the confirmed HTTP status/code pair, never message text.
const messages = {
  profile: { "400/3005": "Họ và tên không hợp lệ." },
  password: {
    "400/4019": "Mật khẩu hiện tại không chính xác.",
    "400/4020": "Mật khẩu mới phải khác mật khẩu hiện tại.",
    "400/4021": "Mật khẩu xác nhận phải khớp với mật khẩu mới.",
    "400/3004": "Mật khẩu mới không đáp ứng yêu cầu bảo mật.",
  },
  revoke: { "404/4022": "Không tìm thấy phiên đăng nhập." },
  deactivation: {
    "400/4019": "Mật khẩu hiện tại không chính xác.",
    "403/4005": "Tài khoản của bạn đã bị vô hiệu hóa.",
    "404/4010": "Không tìm thấy tài khoản.",
  },
};

const fallbacks = {
  profile: "Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và thử lại.",
  password: "Không thể đổi mật khẩu. Vui lòng kiểm tra thông tin và thử lại.",
  sessions: "Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.",
  revoke: "Không thể thu hồi phiên đăng nhập. Vui lòng thử lại.",
  globalLogout: "Không thể đăng xuất trên tất cả thiết bị. Vui lòng thử lại.",
  deactivation: "Không thể vô hiệu hóa tài khoản. Vui lòng kiểm tra thông tin và thử lại.",
};

export function accountErrorMessage(error, operation) {
  if (operation === "profile" && error.status == null) {
    return "Không thể xác nhận hồ sơ đã được lưu hay chưa. Hãy kiểm tra lại thông tin tài khoản trước khi thử lại.";
  }
  if (operation === "revoke" && error.status == null) {
    return "Không thể xác nhận phiên đăng nhập đã được thu hồi hay chưa. Hãy tải lại danh sách phiên đăng nhập để kiểm tra.";
  }
  const confirmed = typeof error.status === "number" && typeof error.code === "number"
    ? messages[operation]?.[`${error.status}/${error.code}`] : undefined;
  return confirmed ?? fallbacks[operation];
}
