import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
	const cookieStore = await cookies();
	// Clear auth cookies
	cookieStore.delete('access_token');
	cookieStore.delete('refresh_token');
	cookieStore.delete('organization_id');

	return NextResponse.json({ success: true });
}
