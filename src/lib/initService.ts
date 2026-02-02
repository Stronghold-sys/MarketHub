import { api } from './supabase';

let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;

/**
 * Initialize the application backend (database, admin account, products)
 * This runs automatically on app startup and is safe to call multiple times.
 */
export async function initializeApp(): Promise<boolean> {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log('✅ App already initialized');
    return true;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('⏳ Initialization already in progress, waiting...');
    return initializationPromise;
  }

  // Start initialization
  console.log('🚀 Starting app initialization...');
  initializationPromise = (async () => {
    try {
      const response = await api.post('/init', {});
      
      if (response.success) {
        console.log('✅ App initialization complete!');
        console.log('📊 Initialization details:', response);
        
        // Log admin credentials for convenience
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 DEFAULT ADMIN CREDENTIALS:');
        console.log('   Email: utskelompok03@gmail.com');
        console.log('   Password: 123456');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        
        isInitialized = true;
        return true;
      } else {
        console.error('❌ Initialization failed:', response.error);
        return false;
      }
    } catch (error: any) {
      console.error('💥 Initialization error:', error);
      return false;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Check if app has been initialized
 */
export function isAppInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
}
