// Supabase client wrapper
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase keys are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Photo uploads will fail until configured.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "student-photos";