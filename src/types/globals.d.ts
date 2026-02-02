// Global type declarations

// ✅ REMOVED: React Router module declaration (not needed in v7)
// React Router v7 exports everything from 'react-router' package directly

// Supabase info module (Figma Make specific)
declare module '/utils/supabase/info' {
  export const projectId: string;
  export const publicAnonKey: string;
}

declare module '/utils/supabase/info.tsx' {
  export const projectId: string;
  export const publicAnonKey: string;
}

// Supabase utilities (Works in both environments)
declare module '/utils/supabase' {
  export const projectId: string;
  export const publicAnonKey: string;
  export const supabaseUrl: string;
  export const supabaseAnonKey: string;
  export const supabase: any;
  export function isSupabaseConfigured(): boolean;
}

declare module '/utils/supabase/config' {
  export function getSupabaseUrl(): string;
  export function getSupabaseAnonKey(): string;
  export function getProjectId(): string;
  export function validateSupabaseConfig(): { valid: boolean; error?: string };
}

declare module '/utils/supabase/client' {
  export const supabaseUrl: string;
  export const supabaseAnonKey: string;
  export const supabase: any;
  export function isSupabaseConfigured(): boolean;
}