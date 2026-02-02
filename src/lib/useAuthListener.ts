import { useEffect, useRef } from 'react';
import { getSupabase } from './supabase';
import { authStoreHelpers, authStoreInstance } from './storeV2';
import { api } from './supabase';

// ✅ VERSION CHECK - To confirm latest version is loaded
console.log('📦 [AuthListener] Loading useAuthListener.ts v17.3.0 - FIXED AUTH ENDPOINT');

/**
 * ✅ Hook untuk monitor Supabase Auth State Changes - OPTIMIZED VERSION
 * 
 * OPTIMIZATIONS:
 * - Caching: Don't fetch profile if already in store with same session
 * - Debouncing: Prevent duplicate fetches within short time window
 * - Silent mode: Reduce console noise
 */

// ✅ Global flag to prevent multiple simultaneous profile fetches
let isFetchingProfile = false;
let lastProfileFetchTime = 0;
const PROFILE_FETCH_DEBOUNCE = 1000; // 1 second debounce

// ✅ Helper to safely fetch user profile - WITH CACHING
const safelyFetchProfile = async (sessionToken: string, sessionUserId: string, context: string): Promise<boolean> => {
  // ✅ CHECK 1: Skip if already fetching
  if (isFetchingProfile) {
    console.log(`⏭️ [AuthListener][${context}] Profile fetch already in progress, skipping...`);
    return false;
  }

  // ✅ CHECK 2: Skip if we already have this user in store
  const currentUser = authStoreInstance.getState().user;
  if (currentUser && currentUser.id === sessionUserId) {
    console.log(`⏭️ [AuthListener][${context}] User already in store, skipping profile fetch`);
    
    // Just update token if needed
    const currentToken = authStoreInstance.getState().accessToken;
    if (currentToken !== sessionToken) {
      console.log(`🔄 [AuthListener][${context}] Updating token`);
      authStoreHelpers.setToken(sessionToken);
    }
    return true;
  }

  // ✅ CHECK 3: Debounce - Skip if fetched recently (within 1 second)
  const now = Date.now();
  if (now - lastProfileFetchTime < PROFILE_FETCH_DEBOUNCE) {
    console.log(`⏭️ [AuthListener][${context}] Profile fetched recently, skipping...`);
    return false;
  }

  isFetchingProfile = true;
  lastProfileFetchTime = now;

  try {
    console.log(`🔍 [AuthListener][${context}] Fetching user profile...`);
    
    // ✅ FIX v17.3: Use correct endpoint /auth/me (not /auth/profile)
    const response = await api.get('/auth/me', sessionToken);
    
    if (response.success && response.user) {
      authStoreHelpers.setUser(response.user, sessionToken);
      console.log(`✅ [AuthListener][${context}] User profile loaded:`, response.user.email);
      return true;
    } else {
      console.warn(`⚠️ [AuthListener][${context}] Profile fetch returned no user data:`, response);
      return false;
    }
  } catch (error: any) {
    // ✅ CRITICAL: JANGAN logout on error - just log it
    console.error(`❌ [AuthListener][${context}] Failed to load user profile:`, error.message);
    console.log(`💡 [AuthListener][${context}] Continuing with basic user info from session`);
    return false;
  } finally {
    isFetchingProfile = false;
  }
};

export function useAuthListener() {
  const hasInitialized = useRef(false);
  const supabase = getSupabase();

  useEffect(() => {
    // ✅ Prevent multiple listeners
    if (hasInitialized.current) {
      console.log('⏭️ [AuthListener] Already initialized, skipping...');
      return;
    }
    hasInitialized.current = true;

    console.log('🔐 [AuthListener] Initializing auth state listener...');

    // ✅ FIX v16.9: Use AbortController to prevent AbortError on unmount
    const abortController = new AbortController();
    const signal = abortController.signal;

    // ✅ Check for existing session on mount
    const restoreSession = async () => {
      // Early exit if aborted
      if (signal.aborted) {
        console.log('⏭️ [AuthListener][Mount] Aborted, skipping session restore');
        return;
      }

      try {
        console.log('🔍 [AuthListener][Mount] Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Check if aborted after async call
        if (signal.aborted) {
          console.log('⏭️ [AuthListener][Mount] Aborted after getSession');
          return;
        }
        
        if (error) {
          // ✅ Ignore AbortError silently
          if (error.name === 'AbortError') {
            return;
          }
          console.error('❌ [AuthListener][Mount] Error getting session:', error.message);
          return;
        }

        if (session?.user) {
          console.log('✅ [AuthListener][Mount] Valid session found:', session.user.email);
          
          // ✅ CRITICAL: Verify token exists
          if (!session.access_token || session.access_token.length < 20) {
            console.warn('⚠️ [AuthListener][Mount] Invalid access token, skipping restore');
            return;
          }
          
          // ✅ OPTIMIZED: Use cached version with debouncing
          const profileFetched = await safelyFetchProfile(session.access_token, session.user.id, 'Mount');
          
          // Check if aborted after profile fetch
          if (signal.aborted) {
            console.log('⏭️ [AuthListener][Mount] Aborted after profile fetch');
            return;
          }
          
          // ✅ Fallback: If profile fetch failed or skipped, use basic info from session
          if (!profileFetched) {
            const currentUser = authStoreInstance.getState().user;
            // Only set if we don't have user data at all
            if (!currentUser) {
              console.log('💡 [AuthListener][Mount] Using basic user info from session');
              authStoreHelpers.setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email || '',
                role: session.user.user_metadata?.role || 'user',
                status: 'active',
              }, session.access_token);
            }
          }
        } else {
          console.log('ℹ️ [AuthListener][Mount] No active session (user not logged in)');
        }
      } catch (error: any) {
        // ✅ CRITICAL: Silently ignore AbortError
        if (error.name === 'AbortError' || signal.aborted) {
          return;
        }
        console.error('❌ [AuthListener][Mount] Error restoring session:', error.message);
      }
    };

    // Restore session on mount
    restoreSession();

    // ✅ Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Early exit if aborted
        if (signal.aborted) return;

        console.log('🔄 [AuthListener] AUTH EVENT:', event, session?.user?.email || 'no user');

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ [AuthListener][SignIn] User signed in:', session?.user?.email);
            if (session?.user && !signal.aborted) {
              const profileFetched = await safelyFetchProfile(session.access_token, session.user.id, 'SignIn');
              
              if (!profileFetched && !signal.aborted) {
                const currentUser = authStoreInstance.getState().user;
                if (!currentUser || currentUser.id !== session.user.id) {
                  console.log('💡 [AuthListener][SignIn] Using basic user info');
                  authStoreHelpers.setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || session.user.email || '',
                    role: session.user.user_metadata?.role || 'user',
                    status: 'active',
                  }, session.access_token);
                }
              }
            }
            break;

          case 'SIGNED_OUT':
            // ✅ FIX v16.4: Just clear state, DON'T call logout() again
            console.log('🚪 [AuthListener][SignOut] User signed out - clearing state');
            if (!signal.aborted) {
              authStoreInstance.setState({
                user: null,
                accessToken: null,
                isAuthenticated: false,
              });
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 [AuthListener][TokenRefresh] Token refreshed');
            if (session?.access_token && !signal.aborted) {
              const currentToken = authStoreInstance.getState().accessToken;
              if (currentToken !== session.access_token) {
                authStoreHelpers.setToken(session.access_token);
                console.log('✅ [AuthListener][TokenRefresh] Token updated');
              }
            }
            break;

          case 'USER_UPDATED':
            console.log('🔄 [AuthListener][UserUpdate] User updated');
            if (session?.user && !signal.aborted) {
              await safelyFetchProfile(session.access_token, session.user.id, 'UserUpdate');
            }
            break;

          default:
            console.log('ℹ️ [AuthListener] Event:', event);
        }
      }
    );

    console.log('✅ [AuthListener] Listener active');

    // ✅ FIX v16.9: Cleanup with abort controller
    return () => {
      console.log('🔌 [AuthListener] Unsubscribing and aborting pending requests');
      abortController.abort();
      subscription.unsubscribe();
    };
  }, [supabase]);
}