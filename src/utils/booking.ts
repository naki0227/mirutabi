export function generateHotelLink(name: string, checkIn?: string, checkOut?: string, adults: number = 2, children: number = 0): string {
    const baseUrl = 'https://www.booking.com/searchresults.html';
    const params = new URLSearchParams();
    params.append('ss', name);
    if (checkIn) params.append('checkin', checkIn);
    if (checkOut) params.append('checkout', checkOut);
    params.append('group_adults', adults.toString());
    params.append('group_children', children.toString());

    return `${baseUrl}?${params.toString()}`;
}

export function generateTransportLink(from: string, to: string): string {
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const params = new URLSearchParams();
    params.append('origin', from);
    params.append('destination', to);
    params.append('travelmode', 'transit');

    return `${baseUrl}&${params.toString()}`;
}

export function generateRestaurantLink(name: string): string {
    const baseUrl = 'https://www.google.com/maps/search/?api=1';
    const params = new URLSearchParams();
    params.append('query', name);

    return `${baseUrl}&${params.toString()}`;
}

export function generateActivityLink(name: string): string {
    // Klook or Veltra could be good, but Google Search is safest fallback
    const baseUrl = 'https://www.google.com/search';
    const params = new URLSearchParams();
    params.append('q', name + ' 予約');

    return `${baseUrl}?${params.toString()}`;
}

export function generateFlightLink(from: string, to: string, date?: string): string {
    // Google Flights
    // flt=Origin.Dest.Date
    // Example: https://www.google.com/flights?hl=ja#flt=Tokyo.Osaka.2024-01-01;c:JPY;e:1;sd:1;t:f
    const dateStr = date ? date : new Date().toISOString().split('T')[0];
    return `https://www.google.com/flights?hl=ja#flt=${encodeURIComponent(from)}.${encodeURIComponent(to)}.${dateStr};c:JPY;e:1;sd:1;t:f`;
}

export function generateBusLink(from: string, to: string, date?: string): string {
    // Use Google Search with "Reservation" keyword as deep linking to bus sites requires specific area codes
    const dateStr = date ? date : '';
    return `https://www.google.com/search?q=${encodeURIComponent(`高速バス ${from} ${to} 予約 ${dateStr}`)}`;
}

export function generateTrainLink(from: string, to: string, date?: string): string {
    // Use Google Search with "Reservation" keyword
    const dateStr = date ? date : '';
    return `https://www.google.com/search?q=${encodeURIComponent(`新幹線 ${from} ${to} 予約 ${dateStr}`)}`;
}
