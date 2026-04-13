import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "홀리카우",
  description: "홀덤 핸드리뷰 중심 모바일 웹 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
