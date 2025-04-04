import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function POST(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const body = await req.json();

		const response = await fetch(`${process.env.API_URL}/api/v1/notes/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken.value}`,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			if (response.status === 401) {
				return createUnauthorizedResponse();
			}
			return Response.json(
				{ error: 'Failed to create note' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error creating note:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
