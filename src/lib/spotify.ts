const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback`
    : 'http://127.0.0.1:3000/api/spotify/callback';

const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read' // For getting top artists/tracks
].join(' ');

export const getSpotifyAuthUrl = () => {
    if (!SPOTIFY_CLIENT_ID) return '';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state: generateRandomString(16)
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getSpotifyTokens = async (code: string) => {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error('Spotify credentials not set');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Spotify Token Error: ${error.error_description || error.error}`);
    }

    return response.json();
};

export const refreshSpotifyToken = async (refreshToken: string) => {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error('Spotify credentials not set');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    return response.json();
};

export const getTopArtists = async (accessToken: string) => {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.items.map((artist: { name: string }) => artist.name);
};

export const getTopTracks = async (accessToken: string) => {
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.items.map((track: { name: string; artists: { name: string }[] }) => `${track.name} by ${track.artists[0].name}`);
};

function generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
