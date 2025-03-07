import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const awaitedParams = await params;
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const response = await fetch(
			`${process.env.API_URL}/api/v1/users/${awaitedParams.userId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${accessToken.value}`,
				},
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				return createUnauthorizedResponse();
			}
			const error = await response.json();
			return NextResponse.json(
				{ error: error.detail || 'Failed to delete member' },
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
