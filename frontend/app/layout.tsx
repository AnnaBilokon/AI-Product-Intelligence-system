import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";

import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AI Product Insights",
  description:
    "AI-powered dashboard for product feedback ingestion, analysis, and customer intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} bg-hero-grid text-ink`}
      >
        <div className="grid min-h-screen lg:grid-cols-[300px,1fr]">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              <MobileNav />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
