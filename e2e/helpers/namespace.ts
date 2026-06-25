// 테스트 계정 네임스페이스. 정리 로직은 이 두 조건을 모두 만족하는 문서에만 작용한다.
// .invalid TLD는 실제 이메일이 될 수 없어, 실데이터 오염을 구조적으로 차단한다.
export const TEST_EMAIL_PREFIX = "e2e-";
export const TEST_EMAIL_DOMAIN = "@e2e.invalid";

export function isTestEmail(email: string): boolean {
  return email.startsWith(TEST_EMAIL_PREFIX) && email.endsWith(TEST_EMAIL_DOMAIN);
}

export function newTestEmail(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${TEST_EMAIL_PREFIX}${Date.now()}-${rand}${TEST_EMAIL_DOMAIN}`;
}
