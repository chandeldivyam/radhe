import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function handleUnauthorized() {
	try {
		const cookieStore = await cookies();
		cookieStore.delete('access_token');
		cookieStore.delete('refresh_token');
		cookieStore.delete('organization_id');
		redirect('/login');
	} catch (error) {
		console.error('Error handling unauthorized:', error);
		redirect('/login');
	}
}
