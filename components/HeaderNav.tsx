"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOutIcon } from "lucide-react";

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      {!isDashboard && (
        <>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/skills/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
          >
            + New Skill
          </Link>
        </>
      )}

      {user && (
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[140px]">
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-secondary"
            title="Sign out"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
