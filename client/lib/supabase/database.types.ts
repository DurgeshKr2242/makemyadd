/**
 * Generated Supabase types — placeholder.
 *
 * Replace with the real output of `pnpm db:types` once a Supabase project is
 * linked. Until then we expose a permissive `Database` type so the three
 * clients compile.
 *
 * Do NOT hand-edit. The CLI overwrites this file.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
