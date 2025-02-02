import { AuthTokens } from '@/types/auth';

// Store tokens in HTTP-only cookies (handled by backend)
export const storeTokens = async (tokens: AuthTokens) => {
	// The backend will set the cookies, we just need to store the access token
	// in memory for immediate use
	return tokens.access_token;
};

export const clearTokens = async () => {
	// The backend will clear the cookies
	await fetch('/api/auth/logout', {
		method: 'POST',
		credentials: 'include',
	});
};

export const refreshTokens = async (): Promise<string | null> => {
	try {
		const response = await fetch('/api/auth/refresh', {
			method: 'POST',
			credentials: 'include', // Important for sending cookies
		});

		if (!response.ok) {
			console.error('Failed to refresh token', response);
			throw new Error('Failed to refresh token');
		}

		const data = await response.json();
		
		if (!data.access_token) {
			console.error('No access token in refresh response');
			throw new Error('Invalid refresh response');
		}

		return data.access_token;
	} catch (error) {
		console.error('Token refresh failed:', error);
		return null;
	}
};
