import { test as base, expect } from "@playwright/test";
import type { Firestore } from "firebase-admin/firestore";
import { adminDb } from "../helpers/admin";
import { seedUser, type SeededUser } from "../helpers/seed";
import { mintSession } from "../helpers/session";
import { deleteUser } from "../helpers/cleanup";

type Fixtures = {
  db: Firestore;
  // 기본 카테고리가 시드된 로그인 상태 유저. 세션 쿠키가 컨텍스트에 주입된다.
  appUser: SeededUser;
};

export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    await use(adminDb());
  },
  appUser: async ({ context, baseURL }, use) => {
    const user = await seedUser();
    const token = await mintSession(user.uid, "password");
    await context.addCookies([
      {
        name: "session",
        value: token,
        url: baseURL ?? "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await use(user);
    await deleteUser(user.uid, user.email);
  },
});

export { expect };
