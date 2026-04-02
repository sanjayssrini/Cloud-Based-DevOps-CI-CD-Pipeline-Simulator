import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Cloud-Based DevOps CI/CD Pipeline Simulator",
  description: "Deterministic DevOps simulator for safe hands-on learning"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
