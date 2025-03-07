import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function POST(request: Request) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const body = await request.json();

		const response = await fetch(
			`${process.env.API_URL}/api/v1/users/add`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken.value}`,
				},
				body: JSON.stringify(body),
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				return createUnauthorizedResponse();
			}
			const error = await response.json();
			return NextResponse.json(
				{ error: error.detail || 'Failed to add member' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error('Error adding member:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
