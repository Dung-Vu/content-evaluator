import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lexend, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const displayFont = Lexend({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Content Evaluator — Bonario & Ordinaire",
  description:
    "Hệ thống chấm điểm và đánh giá nội dung tự động dựa trên tiêu chuẩn thương hiệu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
