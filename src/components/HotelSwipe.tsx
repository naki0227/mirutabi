'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import HotelCard from './HotelCard';
import { Hotel } from '@/types/hotel';
import { mockHotels } from '@/data/mockHotels';

interface HotelSwipeProps {
    onFinish: (likedHotels: Hotel[]) => void;
}

export default function HotelSwipe({ onFinish }: HotelSwipeProps) {
    const [hotels, setHotels] = useState<Hotel[]>(mockHotels);
    const [likedHotels, setLikedHotels] = useState<Hotel[]>([]);
    const [currentIndex, setCurrentIndex] = useState(mockHotels.length - 1);

    const handleSwipe = (direction: 'left' | 'right') => {
        const currentHotel = hotels[currentIndex];

        if (direction === 'right') {
            setLikedHotels(prev => [...prev, currentHotel]);
        }

        if (currentIndex === 0) {
            // Last card swiped
            onFinish(direction === 'right' ? [...likedHotels, currentHotel] : likedHotels);
        } else {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto h-[600px]">
            <AnimatePresence>
                {hotels.map((hotel, index) => (
                    index === currentIndex && (
                        <HotelCard
                            key={hotel.id}
                            hotel={hotel}
                            onSwipe={handleSwipe}
                            active={true}
                        />
                    )
                ))}
            </AnimatePresence>

            {/* Background Placeholder when empty */}
            {currentIndex < 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                    好みを分析中...
                </div>
            )}

            {/* Controls */}
            <div className="absolute -bottom-24 left-0 w-full flex justify-center gap-8">
                <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 text-3xl hover:scale-110 transition"
                >
                    ✕
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-green-500 text-3xl hover:scale-110 transition"
                >
                    ♥
                </button>
            </div>
        </div>
    );
}
