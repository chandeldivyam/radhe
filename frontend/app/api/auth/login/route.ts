import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const formData = new URLSearchParams();
		formData.append('username', body.email);
		formData.append('password', body.password);

		const response = await fetch(
			`${process.env.API_URL}/api/v1/auth/login`,
			{
				method: 'POST',
				body: formData,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Authentication failed' },
				{ status: response.status }
			);
		}

		const data = await response.json();

		// Set cookies
		const cookieStore = await cookies();
		cookieStore.set('access_token', data.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 30 * 60, // 30 minutes
		});

		cookieStore.set('refresh_token', data.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7 days
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
