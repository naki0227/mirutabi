const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function searchPlace(query: string) {
    console.log(`[GooglePlaces] Checking API Key: ${!!GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'}`);
    if (!GOOGLE_MAPS_API_KEY) return null;

    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=ja`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.results.length > 0) {
            return data.results[0].place_id;
        }
        return null;
    } catch (error) {
        console.error('[GooglePlaces] Error searching place:', error);
        return null;
    }
}

export async function getPlaceDetails(placeId: string) {
    if (!GOOGLE_MAPS_API_KEY) return null;

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,photos,opening_hours&key=${GOOGLE_MAPS_API_KEY}&language=ja`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK') {
            const result = data.result;
            let photoUrl = null;

            if (result.photos && result.photos.length > 0) {
                const photoRef = result.photos[0].photo_reference;
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`;
            }

            return {
                name: result.name,
                rating: result.rating,
                address: result.formatted_address,
                photoUrl: photoUrl,
                isOpenNow: result.opening_hours?.open_now
            };
        }
        return null;
    } catch (error) {
        console.error('[GooglePlaces] Error getting place details:', error);
        return null;
    }
}
