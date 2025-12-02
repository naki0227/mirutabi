'use client';

import { useState, useEffect } from 'react';
import { getPosts } from '@/lib/db';
import { Post } from '@/types/firestore';
import BookingModal from '@/components/BookingModal';
import { Bookmark, Zap } from 'lucide-react';

export default function SavedPage() {
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    useEffect(() => {
        loadSavedPosts();
    }, []);

    const loadSavedPosts = async () => {
        try {
            // In a real app, we would fetch only saved posts by ID.
            // Here we fetch all and filter by local storage for the mock.
            const allPosts = await getPosts(50);
            const savedIds = localStorage.getItem('saved_posts') ? JSON.parse(localStorage.getItem('saved_posts')!) : [];
            const filtered = allPosts.filter(p => savedIds.includes(p.post_id));
            setSavedPosts(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">保存済みの旅 <Bookmark className="text-blue-600" /></h1>

            {loading ? (
                <div className="text-center py-10">読み込み中...</div>
            ) : savedPosts.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                    <p>保存された投稿はありません。</p>
                    <p className="text-sm">フィードから気になるスポットを保存しましょう！</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {savedPosts.map(post => (
                        <div key={post.post_id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="aspect-square relative">
                                {post.media_type === 'video' ? (
                                    <video src={post.media_url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-white text-xs font-bold truncate">
                                        {post.location?.name || '場所不明'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-3">
                                <button
                                    onClick={() => setSelectedPost(post)}
                                    className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition flex items-center justify-center gap-1"
                                >
                                    <Zap size={16} /> 3秒で予約
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <BookingModal
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                destination={selectedPost?.location?.name || 'Destination'}
            />
        </div>
    );
}
