import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 네이티브/대형 서버 전용 패키지는 번들하지 않고 런타임에 require 한다.
  serverExternalPackages: ["@node-rs/argon2", "firebase-admin"],
};

export default nextConfig;
