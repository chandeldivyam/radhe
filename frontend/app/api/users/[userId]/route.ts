import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleUnauthorized } from '@/lib/auth/handleUnauthorized';

export async function DELETE(
	request: Request,
	{ params }: { params: { userId: string } }
) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const response = await fetch(
			`${process.env.API_URL}/api/v1/users/${params.userId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${accessToken.value}`,
				},
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				await handleUnauthorized();
			}
			return NextResponse.json(
				{ error: 'Failed to delete member' },
				{ status: response.status }
			);
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('Error deleting member:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
