// ./frontend/app/api/tasks/route.ts
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function GET(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const searchParams = req.nextUrl.searchParams;
		const skip = Number(searchParams.get('skip')) || 0;
		const limit = Number(searchParams.get('limit')) || 20;

		const apiUrl = `${process.env.API_URL}/api/v1/agent_tasks/?skip=${skip}&limit=${limit}`;

		const response = await fetch(apiUrl, {
			headers: {
				Authorization: `Bearer ${accessToken.value}`,
			},
		});

		if (!response.ok) {
			if (response.status === 401) {
				return createUnauthorizedResponse();
			}
			throw new Error('Failed to fetch tasks');
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error fetching tasks:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		const apiUrl = `${process.env.API_URL}/api/v1/agent_tasks/`;
		const body = await req.json();

		const response = await fetch(apiUrl, {
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
			throw new Error('Failed to create task');
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error creating task:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
