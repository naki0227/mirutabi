'use client';

import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { RouteStop } from '@/types/firestore';
import { useState, useEffect, useMemo } from 'react';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.75rem',
};

interface MapComponentProps {
    stops: RouteStop[];
}

export default function MapComponent({ stops }: MapComponentProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
    const [geocodedStops, setGeocodedStops] = useState<(RouteStop & { lat: number; lng: number })[]>([]);

    const center = useMemo(() => ({ lat: 35.6895, lng: 139.6917 }), []); // Default to Tokyo

    useEffect(() => {
        if (!isLoaded || !stops.length) return;

        const geocoder = new window.google.maps.Geocoder();
        const fetchCoordinates = async () => {
            const results = await Promise.all(
                stops.map(async (stop) => {
                    // Skip transport types as they often contain "Origin -> Destination" which fails geocoding
                    if (['flight', 'train', 'bus', 'transport'].includes(stop.type || '')) {
                        return null;
                    }

                    try {
                        const response = await geocoder.geocode({ address: stop.stop_name });
                        if (response.results[0]) {
                            const location = response.results[0].geometry.location;
                            return {
                                ...stop,
                                lat: location.lat(),
                                lng: location.lng()
                            };
                        }
                    } catch (e: any) {
                        // ZERO_RESULTS is common for vague names, just ignore it to avoid console noise
                        if (e.code !== 'ZERO_RESULTS') {
                            console.warn(`Geocoding warning for ${stop.stop_name}:`, e.message || e);
                        }
                    }
                    return null;
                })
            );
            setGeocodedStops(results.filter((s): s is (RouteStop & { lat: number; lng: number }) => s !== null));
        };

        fetchCoordinates();
    }, [isLoaded, stops]);

    const onLoad = (map: google.maps.Map) => {
        setMap(map);
    };

    const onUnmount = () => {
        setMap(null);
    };

    useEffect(() => {
        if (map && geocodedStops.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            geocodedStops.forEach((stop) => {
                bounds.extend({ lat: stop.lat, lng: stop.lng });
            });
            map.fitBounds(bounds);
        }
    }, [map, geocodedStops]);

    const path = geocodedStops.map(stop => ({ lat: stop.lat, lng: stop.lng }));

    if (!isLoaded) return <div className="w-full h-[400px] bg-gray-800 rounded-xl animate-pulse"></div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                styles: [
                    {
                        featureType: 'all',
                        elementType: 'geometry',
                        stylers: [{ color: '#242f3e' }]
                    },
                    {
                        featureType: 'all',
                        elementType: 'labels.text.stroke',
                        stylers: [{ color: '#242f3e' }]
                    },
                    {
                        featureType: 'all',
                        elementType: 'labels.text.fill',
                        stylers: [{ color: '#746855' }]
                    },
                ]
            }}
        >
            {geocodedStops.map((stop, index) => (
                <Marker
                    key={stop.spot_id}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    label={{
                        text: (index + 1).toString(),
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                    onClick={() => setSelectedStop(stop)}
                />
            ))}

            <Polyline
                path={path}
                options={{
                    strokeColor: '#60A5FA', // Blue-400
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                }}
            />

            {selectedStop && (
                <InfoWindow
                    position={{ lat: (selectedStop as any).lat, lng: (selectedStop as any).lng }}
                    onCloseClick={() => setSelectedStop(null)}
                >
                    <div className="text-black p-2">
                        <h3 className="font-bold">{selectedStop.stop_name}</h3>
                        <p className="text-sm">{selectedStop.notes}</p>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
