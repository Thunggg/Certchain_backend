export const ErrorCodes: {
  SUCCESS: number
  INTERNAL: number
  VALIDATION: number
  AUTHENTICATION: number
  AUTHORIZATION: number
  NOT_FOUND: number
  CONFLICT: number
  BAD_REQUEST: number
} = {
  SUCCESS: 0, // Request thành công (dùng kèm HTTP 200/201)
  INTERNAL: 1000, // Lỗi hệ thống nội bộ (500 Internal Server Error)
  VALIDATION: 1001, // Dữ liệu đầu vào không hợp lệ (422 Unprocessable Entity)
  AUTHENTICATION: 1002, // Lỗi xác thực (401 Unauthorized – chưa login / token sai)
  AUTHORIZATION: 1003, // Lỗi phân quyền (403 Forbidden – login rồi nhưng không có quyền)
  NOT_FOUND: 1004, // Không tìm thấy tài nguyên (404 Not Found)
  CONFLICT: 1005, // Xung đột dữ liệu (409 Conflict – email/username đã tồn tại)
  BAD_REQUEST: 1006 // Yêu cầu sai cấu trúc hoặc dữ liệu không hợp lệ (400 Bad Request)
} as const
