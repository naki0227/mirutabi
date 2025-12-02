'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Hotel } from '@/types/hotel';

interface HotelCardProps {
    hotel: Hotel;
    onSwipe: (direction: 'left' | 'right') => void;
    active: boolean;
}

export default function HotelCard({ hotel, onSwipe, active }: HotelCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Background color change based on swipe direction
    const bg = useTransform(x, [-200, 0, 200], ['rgba(255, 0, 0, 0.2)', 'rgba(255, 255, 255, 0)', 'rgba(0, 255, 0, 0.2)']);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    if (!active) return null;

    return (
        <motion.div
            style={{ x, rotate, opacity, background: bg }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing bg-white"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="relative h-3/4 w-full">
                <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h2 className="text-3xl font-bold mb-1">{hotel.name}</h2>
                    <p className="text-sm font-medium opacity-90">📍 {hotel.location}</p>
                </div>
            </div>
            <div className="p-6 h-1/4 flex flex-col justify-between">
                <div className="flex flex-wrap gap-2 mb-2">
                    {hotel.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                            #{tag}
                        </span>
                    ))}
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                        {hotel.priceRange}
                    </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{hotel.description}</p>
            </div>

            {/* Overlay Labels */}
            <motion.div
                style={{ opacity: useTransform(x, [20, 100], [0, 1]) }}
                className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-2 rounded-lg transform -rotate-12"
            >
                LIKE
            </motion.div>
            <motion.div
                style={{ opacity: useTransform(x, [-100, -20], [1, 0]) }}
                className="absolute top-8 right-8 border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded-lg transform rotate-12"
            >
                NOPE
            </motion.div>
        </motion.div>
    );
}
