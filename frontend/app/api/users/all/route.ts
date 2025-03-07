import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function GET() {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const response = await fetch(
			`${process.env.API_URL}/api/v1/users/all`,
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
			return NextResponse.json(
				{ error: 'Failed to fetch members' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching members:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
