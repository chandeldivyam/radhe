import { cookies } from 'next/headers';

export async function handleUnauthorized() {
	const cookieStore = await cookies();
	cookieStore.delete('access_token');
	cookieStore.delete('refresh_token');
	cookieStore.delete('organization_id');

	// Instead of redirecting, return a boolean indicating success
	return true;
}

// Add a new function for API routes
export function createUnauthorizedResponse() {
	return Response.json(
		{ error: 'Unauthorized', redirect: '/login' },
		{
			status: 401,
			headers: {
				Location: '/login',
			},
		}
	);
}
