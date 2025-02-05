import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { handleUnauthorized } from '@/lib/auth/handleUnauthorized';

export async function GET(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
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
      `${process.env.API_URL}/api/v1/notes/${params.noteId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await handleUnauthorized();
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return Response.json(
        { error: 'Failed to fetch note' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching note:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      await handleUnauthorized();
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    const response = await fetch(
      `${process.env.API_URL}/api/v1/notes/${params.noteId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.value}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await handleUnauthorized();
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return Response.json(
        { error: 'Failed to update note' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating note:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
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
      `${process.env.API_URL}/api/v1/notes/${params.noteId}`,
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
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return Response.json(
        { error: 'Failed to delete note' },
        { status: response.status }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting note:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
