/**
 * Supabase Info - Backward Compatibility
 * 
 * Re-exports from the main supabase config for backward compatibility.
 */

// ✅ FIX: Import from root /utils/supabase to avoid duplication
export { projectId, publicAnonKey, supabaseUrl, supabaseAnonKey } from '/utils/supabase';
