import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "均衡之渊 — Aequilibrium",
  description: "澄港，初秋。一封信，一把钥匙，还有尚未决定的三年。关于投资、承诺与生活的单机叙事游戏。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
