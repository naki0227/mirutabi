'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicRoutes, toggleLikeRoute, getRouteLikeStatus } from '@/lib/db';
import { Route } from '@/types/firestore';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Heart } from 'lucide-react';

export default function ExplorePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedRoutes, setLikedRoutes] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadRoutes();
    }, [user]);

    const loadRoutes = async () => {
        try {
            const fetchedRoutes = await getPublicRoutes();
            setRoutes(fetchedRoutes);

            if (user) {
                // Check like status for all routes
                const likeStatuses = await Promise.all(
                    fetchedRoutes.map(r => getRouteLikeStatus(r.route_id, user.uid))
                );
                const newLikedRoutes = new Set<string>();
                fetchedRoutes.forEach((r, i) => {
                    if (likeStatuses[i]) newLikedRoutes.add(r.route_id);
                });
                setLikedRoutes(newLikedRoutes);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching public routes:', err);
            setLoading(false);
        }
    };

    const handleLike = async (e: React.MouseEvent, route: Route) => {
        e.stopPropagation();
        if (!user) {
            alert('いいねするにはログインが必要です。');
            return;
        }

        const isLiked = likedRoutes.has(route.route_id);

        // Optimistic update
        const newLikedRoutes = new Set(likedRoutes);
        if (isLiked) {
            newLikedRoutes.delete(route.route_id);
            setRoutes(prev => prev.map(r =>
                r.route_id === route.route_id ? { ...r, likes_count: Math.max(0, (r.likes_count || 0) - 1) } : r
            ));
        } else {
            newLikedRoutes.add(route.route_id);
            setRoutes(prev => prev.map(r =>
                r.route_id === route.route_id ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
            ));
        }
        setLikedRoutes(newLikedRoutes);

        try {
            await toggleLikeRoute(route.route_id, user.uid);
        } catch (error) {
            console.error('Error liking route:', error);
            // Revert on error (could implement more robust revert logic)
            loadRoutes();
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">みんなのプラン</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <div
                            key={route.route_id}
                            onClick={() => router.push(`/plan/${route.route_id}`)}
                            className="bg-white/10 backdrop-blur-md rounded-xl p-6 cursor-pointer hover:bg-white/20 transition border border-white/10"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-white line-clamp-2">{route.title}</h2>
                                <span className="bg-blue-500/20 text-blue-200 text-xs px-2 py-1 rounded">
                                    {route.duration_days ? `${route.duration_days - 1}泊${route.duration_days}日` : '日帰り'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold overflow-hidden">
                                    {/* Note: We need to fetch author image if we want to show it, currently route doesn't have it. 
                                        For now, use initial. */}
                                    {route.author_name ? route.author_name[0] : 'U'}
                                </div>
                                <span className="text-sm text-gray-200">{route.author_name || '匿名ユーザー'}</span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {route.stops.slice(0, 3).map((stop, i) => (
                                    <div key={i} className="flex items-center text-sm text-gray-200">
                                        <MapPin size={14} className="mr-2 text-gray-400" />
                                        <span className="truncate">{stop.stop_name}</span>
                                    </div>
                                ))}
                                {route.stops.length > 3 && (
                                    <div className="text-xs text-gray-300 pl-6">...他 {route.stops.length - 3} 箇所</div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <div className="text-sm text-gray-300">
                                    ¥{route.total_budget?.toLocaleString() || route.stops.reduce((sum, s) => sum + (s.cost_estimate || 0), 0).toLocaleString()}
                                </div>
                                <button
                                    onClick={(e) => handleLike(e, route)}
                                    className={`flex items-center gap-1 transition ${likedRoutes.has(route.route_id) ? 'text-pink-500 scale-110' : 'text-gray-300 hover:text-pink-400'
                                        }`}
                                >
                                    <Heart size={20} fill={likedRoutes.has(route.route_id) ? "currentColor" : "none"} />
                                    <span>{route.likes_count || 0}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {routes.length === 0 && (
                    <div className="text-center text-gray-300 py-12">
                        まだ公開されたプランはありません。
                    </div>
                )}
            </div>
        </div>
    );
}
