'use server';

import { cookies } from 'next/headers';
import { getTopArtists, getTopTracks, getSpotifyAuthUrl } from '@/lib/spotify';

export async function getAuthUrl() {
    return getSpotifyAuthUrl();
}

export async function getSpotifyUserData() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
        return null;
    }

    try {
        const [artists, tracks] = await Promise.all([
            getTopArtists(accessToken),
            getTopTracks(accessToken)
        ]);

        return {
            isConnected: true,
            topArtists: artists,
            topTracks: tracks
        };
    } catch (error) {
        console.error('Error fetching Spotify user data:', error);
        return null;
    }
}
