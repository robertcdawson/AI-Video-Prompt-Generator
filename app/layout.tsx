import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter variable font (latin subset), vendored so builds stay network-free.
// Single file covers weights 100–900; license in app/fonts/LICENSE-Inter.txt.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Video Preproduction",
  description:
    "Turn a rough video idea into a project bible, shot table, and agent-ready prompts. A preproduction compiler for AI video workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
