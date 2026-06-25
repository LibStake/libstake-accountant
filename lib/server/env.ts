import "server-only";

// 서버 시크릿 접근의 단일 통로. 누락 시 사용 시점에 즉시 실패한다.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export const env = {
  get firebaseServiceAccount() {
    return required("FIREBASE_SERVICE_ACCOUNT");
  },
  get jwtSecret() {
    return required("JWT_SECRET");
  },
  get passwordPepper() {
    return required("PASSWORD_PEPPER");
  },
  get pinPepper() {
    return required("PIN_PEPPER");
  },
};
