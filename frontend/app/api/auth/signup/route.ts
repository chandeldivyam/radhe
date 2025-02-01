import { NextResponse } from 'next/server';
import type { CreateOrganizationResponse } from '@/types/auth';

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const apiResponse = await fetch(
			`${process.env.API_URL}/api/v1/organizations/create`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			}
		);

		if (!apiResponse.ok) {
			const errorData = await apiResponse.json();
			return NextResponse.json(
				{ error: errorData.detail || 'Failed to create organization' },
				{ status: apiResponse.status }
			);
		}

		const data: CreateOrganizationResponse = await apiResponse.json();

		// Return organization data without tokens
		const { access_token, refresh_token, ...orgData } = data;

		// Create response with cookies
		const response = NextResponse.json(orgData);

		response.cookies.set({
			name: 'access_token',
			value: access_token,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 30 * 60, // 30 minutes
		});

		response.cookies.set({
			name: 'refresh_token',
			value: refresh_token,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7 days
		});

		response.cookies.set({
			name: 'organization_id',
			value: data.id,
			httpOnly: false,
			secure: false,
			sameSite: 'lax',
		});

		return response;
	} catch (error) {
		console.error('Organization creation error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
