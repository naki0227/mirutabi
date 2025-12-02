'use client';

import { useState, useRef, useEffect } from 'react';
import VideoCard from './VideoCard';
import { Video } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore';

// Mock Data
const MOCK_VIDEOS: Video[] = [
    {
        video_id: 'v1',
        uploader_id: 'traveler_kyoto',
        video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', // Placeholder
        thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        linked_spots: ['spot_kyoto_1'],
        status: 'public',
        likes_count: 1240,
        description: '京都の隠れ家カフェ。抹茶ティラミスが絶品でした！ #京都 #カフェ #抹茶',
        tags: ['kyoto', 'cafe', 'matcha'],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
    },
    {
        video_id: 'v2',
        uploader_id: 'onsen_lover',
        video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Placeholder
        thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        linked_spots: ['spot_hakone_2'],
        status: 'public',
        likes_count: 856,
        description: '箱根の貸切露天風呂。最高のリラックスタイム。 #箱根 #温泉 #旅行',
        tags: ['hakone', 'onsen', 'relax'],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
    },
    {
        video_id: 'v3',
        uploader_id: 'gourmet_hunter',
        video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', // Placeholder
        thumbnail_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        linked_spots: ['spot_osaka_3'],
        status: 'public',
        likes_count: 2300,
        description: '大阪のたこ焼き食べ比べ！ここは外カリ中トロで一番美味しかった。 #大阪 #たこ焼き #グルメ',
        tags: ['osaka', 'takoyaki', 'food'],
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
    },
];

export default function VideoFeed() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const index = Math.round(container.scrollTop / container.clientHeight);
            if (index !== activeIndex) {
                setActiveIndex(index);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [activeIndex]);

    return (
        <div
            ref={containerRef}
            className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
        >
            {MOCK_VIDEOS.map((video, index) => (
                <div key={video.video_id} className="w-full h-full snap-start">
                    <VideoCard video={video} isActive={index === activeIndex} />
                </div>
            ))}
        </div>
    );
}
