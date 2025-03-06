import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { handleUnauthorized } from '@/lib/auth/handleUnauthorized';

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const awaitedParams = await params;
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			await handleUnauthorized();
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		console.log('body', body);

		const response = await fetch(
			`${process.env.API_URL}/api/v1/notes/${awaitedParams.noteId}/move`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken.value}`,
				},
				body: JSON.stringify(body),
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				await handleUnauthorized();
				return Response.json(
					{ error: 'Unauthorized' },
					{ status: 401 }
				);
			}
			return Response.json(
				{ error: 'Failed to move note' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error moving note:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
