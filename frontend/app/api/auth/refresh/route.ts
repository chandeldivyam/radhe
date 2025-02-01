import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
	try {
		const cookieStore = await cookies();
		const refreshToken = cookieStore.get('refresh_token');

		if (!refreshToken) {
			return NextResponse.json(
				{ error: 'No refresh token' },
				{ status: 401 }
			);
		}

		const response = await fetch(
			`${process.env.API_URL}/api/v1/auth/refresh`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${refreshToken.value}`,
				},
			}
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Token refresh failed' },
				{ status: response.status }
			);
		}

		const data = await response.json();

		// Update access token cookie
		cookieStore.set('access_token', data.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 30 * 60, // 30 minutes
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Refresh error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
