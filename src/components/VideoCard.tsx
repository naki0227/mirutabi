'use client';

import { useState, useRef, useEffect } from 'react';
import { Video } from '@/types/firestore';

interface VideoCardProps {
    video: Video;
    isActive: boolean;
}

export default function VideoCard({ video, isActive }: VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.log('Autoplay failed:', err);
                setIsPlaying(false);
            });
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="relative w-full h-full bg-black snap-start shrink-0">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Play/Pause Icon (Centered) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Right Sidebar (Actions) */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 pointer-events-auto">
                {/* Profile */}
                <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full border-2 border-white overflow-hidden">
                        {/* Placeholder for user avatar */}
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>

                {/* Likes */}
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <span className="text-white text-xs font-bold mt-1">{video.likes_count}</span>
                </div>

                {/* Comments */}
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                    </div>
                    <span className="text-white text-xs font-bold mt-1">128</span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                    </div>
                    <span className="text-white text-xs font-bold mt-1">Share</span>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 bottom-6 right-16 pointer-events-auto">
                <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">@{video.uploader_id}</h3>
                <p className="text-white text-sm mb-3 drop-shadow-md line-clamp-2">{video.description}</p>

                {/* Linked Spot / Location */}
                {video.linked_spots && video.linked_spots.length > 0 && (
                    <div className="inline-flex items-center bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium hover:bg-black/60 transition cursor-pointer">
                        <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        See Location
                    </div>
                )}
            </div>

            {/* Mute Toggle */}
            <button
                onClick={toggleMute}
                className="absolute top-20 right-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm pointer-events-auto"
            >
                {isMuted ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
