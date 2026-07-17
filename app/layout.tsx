import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Video Preproduction",
  description:
    "Turn a rough video idea into a project bible, shot table, and agent-ready prompts. A preproduction compiler for AI video workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
