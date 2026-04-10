import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { HeaderNav } from "@/components/HeaderNav";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["800"],
});

export const metadata: Metadata = {
  title: "10,000 Hours",
  description: "Track your path to mastery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="flex items-baseline gap-0.5 group"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
                  10,000
                </span>
                <span className="text-4xl font-extrabold tracking-tight text-foreground group-hover:text-indigo-500 transition-colors">
                  &nbsp;Hours
                </span>
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main className="flex-1 pb-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
