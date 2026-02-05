import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies"; 

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    // FIX: Redirect to "/sign-in" instead of "/" to avoid infinite loop
    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // This regex protects ALL routes (including /screeners) 
        // EXCEPT: api, static files, images, favicon, sign-in, sign-up, assets
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
    ],
};