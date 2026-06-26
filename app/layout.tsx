import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "가계부",
  description: "결제 직후 10초 안에 기록하는 가계부",
};

// 하단 홈 인디케이터 영역까지 safe-area-inset을 노출시켜 하단 탭이 겹치지 않게 한다.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* 모바일 토스트를 하단 탭(높이 4rem)과 safe-area 위로 띄운다. */}
        <Toaster mobileOffset={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.5rem)" }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
