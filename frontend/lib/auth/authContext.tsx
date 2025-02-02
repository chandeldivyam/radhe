'use client';

import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
} from 'react';
import {
	AuthState,
	User,
	CreateOrganizationData,
	AuthTokens,
	UserResponse,
} from '@/types/auth';
import { useRouter } from 'next/navigation';
import { storeTokens, clearTokens, refreshTokens } from './authUtils';

interface AuthContextType extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	createOrganization: (orgData: CreateOrganizationData) => Promise<void>;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
	| { type: 'SET_USER'; payload: User }
	| { type: 'LOGOUT' }
	| { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
	switch (action.type) {
		case 'SET_USER':
			return {
				...state,
				user: action.payload,
				isAuthenticated: true,
				isLoading: false,
			};
		case 'LOGOUT':
			return {
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
			};
		case 'SET_LOADING':
			return {
				...state,
				isLoading: action.payload,
			};
		default:
			return state;
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(authReducer, initialState);
	const router = useRouter();

	// Token refresh logic
	const refreshAccessToken = useCallback(async () => {
		try {
			const newAccessToken = await refreshTokens();
			if (!newAccessToken) {
				dispatch({ type: 'LOGOUT' });
				router.push('/login');
				return false;
			}
			return true;
		} catch (error) {
			console.error('Token refresh failed:', error);
			dispatch({ type: 'LOGOUT' });
			router.push('/login');
			return false;
		}
	}, [router, dispatch]);

	// Setup token refresh interval
	useEffect(() => {
		if (state.isAuthenticated) {
			// Refresh token 1 minute before expiry (29 minutes for 30-minute tokens)
			const refreshInterval = setInterval(
				() => {
					refreshAccessToken();
				},
				29 * 60 * 1000
			);

			return () => clearInterval(refreshInterval);
		}
	}, [state.isAuthenticated, refreshAccessToken]);

	const login = async (email: string, password: string) => {
		dispatch({ type: 'SET_LOADING', payload: true });
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // Important for cookies
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				throw new Error('Login failed');
			}

			const tokens: AuthTokens = await response.json();
			await storeTokens(tokens);
			await checkAuth(); // This will set the user data
			router.push('/home');
		} catch (error) {
			throw error;
		} finally {
			dispatch({ type: 'SET_LOADING', payload: false });
		}
	};

	const checkAuth = useCallback(async () => {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			});

			if (!response.ok) {
				if (response.status === 401) {
					const refreshed = await refreshAccessToken();
					if (refreshed) {
						return checkAuth();
					}
				}
				throw new Error('Auth check failed');
			}

			const user: UserResponse = await response.json();
			dispatch({ type: 'SET_USER', payload: user });
			return true;
		} catch (error) {
			console.error('Auth check failed:', error);
			dispatch({ type: 'LOGOUT' });
			clearTokens();
			if (window.location.pathname !== '/login') {
				window.location.href = '/login';
			}
			return false;
		}
	}, [refreshAccessToken, dispatch]);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const logout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			dispatch({ type: 'LOGOUT' });
			router.push('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const createOrganization = async (orgData: CreateOrganizationData) => {
		dispatch({ type: 'SET_LOADING', payload: true });
		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(orgData),
			});

			if (!response.ok) {
				throw new Error('Organization creation failed');
			}

			await checkAuth();
			router.push('/home');
		} catch (error) {
			throw error;
		} finally {
			dispatch({ type: 'SET_LOADING', payload: false });
		}
	};

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				logout,
				createOrganization,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
