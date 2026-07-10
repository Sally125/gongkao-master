import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "考公大师 - 公务员考试备考管理系统",
  description: "专业的公务员考试备考管理工具，包含学习计划、复盘记录、数据统计等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}