import { sweepTestUsers } from "./helpers/cleanup";

// 크래시 등으로 남은 테스트 계정 잔재를 프리픽스 범위로만 정리한다.
export default async function globalTeardown(): Promise<void> {
  const removed = await sweepTestUsers();
  if (removed > 0) {
    console.log(`[e2e] swept ${removed} leftover test account(s)`);
  }
}
