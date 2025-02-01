import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isPublicPath = publicPaths.includes(pathname);
	const accessToken = request.cookies.get('access_token');
	const refreshToken = request.cookies.get('refresh_token');

	// If no tokens and trying to access protected route
	if (!accessToken && !refreshToken && !isPublicPath) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	// If has tokens and trying to access public route
	if ((accessToken || refreshToken) && isPublicPath) {
		return NextResponse.redirect(new URL('/home', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
