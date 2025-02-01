import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserResponse } from '@/types/auth';
export async function GET() {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return NextResponse.json(
				{ error: 'No access token' },
				{ status: 401 }
			);
		}

		const response = await fetch(`${process.env.API_URL}/api/v1/auth/me`, {
			headers: {
				Authorization: `Bearer ${accessToken.value}`,
			},
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch user' },
				{ status: response.status }
			);
		}

		const data: UserResponse = await response.json();

		cookieStore.set('organization_id', data.organization_id);

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
