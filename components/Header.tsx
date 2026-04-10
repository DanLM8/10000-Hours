"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";

export function Header() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          <Image
            src="/logo.png"
            alt="10,000 Hours logo"
            width={52}
            height={52}
            className="rounded-xl group-hover:opacity-90 transition-opacity"
          />
          <div className="flex items-baseline gap-0.5">
            <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
              10,000
            </span>
            <span className="text-4xl font-extrabold tracking-tight text-foreground group-hover:text-indigo-500 transition-colors">
              &nbsp;Hours
            </span>
          </div>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
