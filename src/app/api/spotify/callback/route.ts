import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyTokens, getTopArtists, getTopTracks } from '@/lib/spotify';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/plan?error=spotify_access_denied', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/plan?error=no_code', request.url));
    }

    try {
        // 1. Exchange code for tokens
        const tokenData = await getSpotifyTokens(code);
        const { access_token, refresh_token, expires_in } = tokenData;

        // 2. Fetch user data immediately to cache it
        const topArtists = await getTopArtists(access_token);
        const topTracks = await getTopTracks(access_token);

        // 3. Store in Firestore
        // Note: We need the user's ID. Since this is a server-side callback, 
        // we might not have the Firebase Auth token easily accessible unless passed via state or cookies.
        // For simplicity in this session, we'll store it in a cookie and let the client save it to Firestore,
        // OR we can try to get the session cookie if using session management.

        // Better approach for this specific flow without complex session management:
        // Redirect back to client with the data in query params (not secure for tokens, but okay for this MVP demo if we just want the data)
        // OR set a secure HTTP-only cookie with the tokens.

        const cookieStore = await cookies();
        cookieStore.set('spotify_access_token', access_token, { secure: true, httpOnly: true, maxAge: expires_in });
        if (refresh_token) {
            cookieStore.set('spotify_refresh_token', refresh_token, { secure: true, httpOnly: true });
        }

        // Redirect back to plan page with success flag
        return NextResponse.redirect(new URL('/plan?spotify_connected=true', request.url));

    } catch (err) {
        console.error('Spotify Callback Error:', err);
        return NextResponse.redirect(new URL('/plan?error=spotify_callback_failed', request.url));
    }
}
