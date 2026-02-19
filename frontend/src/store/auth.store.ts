import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types';
import { authService } from '@/services/auth.service';
import { setAuthStoreRef } from '@/services/api';

interface AuthStore extends Omit<AuthState, 'refreshToken'> {
    // refreshToken is NOT stored - it's in httpOnly cookie
    isInitialized: boolean; // Tracks if auth initialization is complete
    initializationPromise: Promise<void> | null; // Prevents race conditions
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        companyId: string;
        role: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    setAccessToken: (accessToken: string) => void;
    clearAuth: () => void;
    initializeAuth: () => Promise<void>;
    waitForInitialization: () => Promise<void>; // Wait for initialization to complete
}

/**
 * Secure Authentication Store
 * 
 * Security improvements:
 * - Access token stored ONLY in memory (not persisted)
 * - Refresh token stored in httpOnly cookie (handled by backend)
 * - No localStorage usage for sensitive tokens
 * - User data can be persisted (non-sensitive)
 */
// Global initialization promise to prevent multiple simultaneous initializations
let globalInitializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get): AuthStore => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isInitialized: false,
            initializationPromise: null,

            login: async (email: string, password: string) => {
                const response = await authService.login({ email, password });
                // Backend sets refreshToken in httpOnly cookie automatically
                // We only store accessToken in memory
                const { accessToken, user } = response.data;

                set({
                    user,
                    accessToken,
                    // isAuthenticated is true only when both user and accessToken exist
                    isAuthenticated: !!(user && accessToken),
                    isInitialized: true, // Auth state is now known after successful login
                });
            },

            register: async (data) => {
                const response = await authService.register(data);
                // Backend sets refreshToken in httpOnly cookie automatically
                const { accessToken, user } = response.data;

                set({
                    user,
                    accessToken,
                    // isAuthenticated is true only when both user and accessToken exist
                    isAuthenticated: !!(user && accessToken),
                    isInitialized: true, // Auth state is now known after successful register
                });
            },

            logout: async () => {
                // Backend will clear httpOnly cookie
                await authService.logout();
                get().clearAuth();
            },

            setUser: (user: User | null) => {
                const state = get();
                // isAuthenticated requires both user and accessToken
                set({ user, isAuthenticated: !!(user && state.accessToken) });
            },

            setAccessToken: (accessToken: string) => {
                const state = get();
                // isAuthenticated requires both user and accessToken
                set({ accessToken, isAuthenticated: !!(state.user && accessToken) });
            },

            clearAuth: () => {
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    // Keep isInitialized as true - we know auth state (unauthenticated)
                });
            },

            /**
             * Initialize auth state on app load
             * Attempts to refresh token using httpOnly cookie
             * Prevents race conditions by reusing existing promise
             */
            initializeAuth: async () => {
                // If already initialized, return immediately
                if (get().isInitialized) {
                    return;
                }

                // If initialization is in progress, wait for it
                if (globalInitializationPromise) {
                    await globalInitializationPromise;
                    return;
                }

                // Create new initialization promise
                const initPromise = (async () => {
                    try {
                        // Backend reads refreshToken from httpOnly cookie
                        const response = await authService.refreshToken();
                        const { accessToken, user } = response.data;

                        set({
                            user,
                            accessToken,
                            // isAuthenticated is true only when both user and accessToken exist
                            isAuthenticated: !!(user && accessToken),
                            isInitialized: true,
                            initializationPromise: null,
                        });
                    } catch (error) {
                        // Refresh failed - user needs to login
                        // httpOnly cookie may be expired or invalid
                        get().clearAuth();
                        set({
                            isInitialized: true, // Mark as initialized even if failed
                            initializationPromise: null,
                        });
                    } finally {
                        // Clear global promise
                        globalInitializationPromise = null;
                    }
                })();

                // Store promise in both global and store
                globalInitializationPromise = initPromise;
                set({ initializationPromise: initPromise });

                await initPromise;
            },

            /**
             * Wait for initialization to complete
             * Returns immediately if already initialized
             */
            waitForInitialization: async () => {
                const state = get();
                
                // If already initialized, return immediately
                if (state.isInitialized) {
                    return;
                }

                // If initialization is in progress, wait for it
                if (state.initializationPromise) {
                    await state.initializationPromise;
                    return;
                }

                // If no initialization has started, trigger it
                await get().initializeAuth();
            },
        }),
        {
            name: 'auth-storage',
            // Only persist user data (non-sensitive)
            // NEVER persist accessToken or refreshToken
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: false, // Always start as false, will be set after init
            }),
        }
    )
);

// Set auth store reference in API service for token refresh
if (typeof window !== 'undefined') {
    const store = useAuthStore.getState();
    setAuthStoreRef({
        accessToken: store.accessToken,
        setAccessToken: store.setAccessToken,
        setUser: store.setUser,
        clearAuth: store.clearAuth,
    });

    // Update reference when store changes
    useAuthStore.subscribe((state) => {
        setAuthStoreRef({
            accessToken: state.accessToken,
            setAccessToken: state.setAccessToken,
            setUser: state.setUser,
            clearAuth: state.clearAuth,
        });
    });
}
