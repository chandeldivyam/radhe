import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const awaitedParams = await params;

		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const response = await fetch(
			`${process.env.API_URL}/api/v1/notes/${awaitedParams.noteId}/children`,
			{
				headers: {
					Authorization: `Bearer ${accessToken.value}`,
				},
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				return createUnauthorizedResponse();
			}
			return Response.json(
				{ error: 'Failed to fetch children notes' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error fetching children notes:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
