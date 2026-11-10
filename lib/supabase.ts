import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(url && key);
}

// Un solo cliente para toda la app: crear uno nuevo en cada render dejaba
// temporizadores y listeners acumulándose y alentaba la computadora.
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  }
  if (!client) client = createClient(url!, key!);
  return client;
}