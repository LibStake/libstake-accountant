// 테스트 러너가 앱과 동일한 실 시크릿을 쓰도록 강제한다. 누락 시 즉시 실패.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env for E2E tests: ${name} (.env.local에서 로드되어야 함)`);
  }
  return value;
}
