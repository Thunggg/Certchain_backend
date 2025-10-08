export enum UserVerifyStatus {
  Unverified, // chưa xác thực
  Verified, //đã xác thực
  Banned // Bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}
