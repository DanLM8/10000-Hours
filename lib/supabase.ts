import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your credentials."
    );
  }
  return createBrowserClient(url, key);
}

// Singleton for client components
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) _client = createClient();
  return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
