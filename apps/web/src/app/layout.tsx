import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "AcademIQ — AI-Powered Academic OS",
    template: "%s | AcademIQ",
  },
  description:
    "Your AI-powered Academic Operating System. Smart study plans, AI tutoring, habit tracking, and analytics — all in one place.",
  keywords: ["AI study assistant", "academic planner", "learning roadmap", "habit tracker", "quiz generator"],
  authors: [{ name: "AcademIQ" }],
  openGraph: {
    title: "AcademIQ — AI-Powered Academic OS",
    description: "Notion + Duolingo + ChatGPT for students.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
        <body className="bg-mesh min-h-screen antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
