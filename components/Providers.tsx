"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TimerBanner } from "@/components/TimerBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.clear();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    function scheduleMidnightRefresh() {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
      );
      const msUntilMidnight = midnight.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        queryClient.invalidateQueries();
        scheduleMidnightRefresh(); // reschedule for the next midnight
      }, msUntilMidnight);

      return timeout;
    }

    const timeout = scheduleMidnightRefresh();
    return () => clearTimeout(timeout);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <TimerBanner />
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
