import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { handleUnauthorized } from '@/lib/auth/handleUnauthorized';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const skip = Number(searchParams.get('skip')) || 0;
    const limit = Number(searchParams.get('limit')) || 20;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      await handleUnauthorized();
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.API_URL}/api/v1/notes/root?skip=${skip}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await handleUnauthorized();
      }
      throw new Error('Failed to fetch root notes');
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Failed to fetch root notes' },
      { status: 500 }
    );
  }
}
