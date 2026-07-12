import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "sonner";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PassionVerse — Turn what you love into a clear plan",
      description:
        "Tell us what you want to do. Gemini asks five questions and returns a personalized roadmap with steps, budget, timeline, and a text-based AI mentor.",
      keywords: ["AI Mentorship", "Personalized Roadmap", "Google Gemini", "Firebase", "Next.js"],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-neutral-50 font-body text-neutral-900 antialiased selection:bg-purple-500 selection:text-white dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
