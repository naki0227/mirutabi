'use client';

import { useState, useEffect, useRef } from 'react';
import { getReels, deletePost, updatePost, toggleLikePost, getPostLikeStatus, addComment, getPostComments, toggleSavePost } from '@/lib/db';
import { Post, Comment } from '@/types/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Heart, MessageCircle, Bookmark, Send, ArrowLeft, Edit2, Trash2, X, User } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function ReelsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, firestoreUser, refreshFirestoreUser } = useAuth();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState('');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    // Comment State
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [user]);

    const loadPosts = async () => {
        try {
            const fetchedPosts = await getReels(20);
            setPosts(fetchedPosts);

            if (user) {
                const likeStatuses = await Promise.all(
                    fetchedPosts.map(p => getPostLikeStatus(p.post_id, user.uid))
                );
                const newLikedPosts = new Set<string>();
                fetchedPosts.forEach((p, i) => {
                    if (likeStatuses[i]) newLikedPosts.add(p.post_id);
                });
                setLikedPosts(newLikedPosts);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            setLoading(false);
        }
    };

    // Intersection Observer for auto-play
    useEffect(() => {
        if (loading || posts.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target as HTMLVideoElement;
                    if (entry.isIntersecting) {
                        video.play().catch(() => { }); // Auto-play might be blocked
                    } else {
                        video.pause();
                        video.currentTime = 0; // Reset when scrolled away
                    }
                });
            },
            { threshold: 0.6 } // Play when 60% visible
        );

        const videos = document.querySelectorAll('video');
        videos.forEach(v => observer.observe(v));

        return () => observer.disconnect();
    }, [loading, posts]);

    const handleDelete = async (post: Post) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await deletePost(post.post_id, post.media_url);
            setPosts(prev => prev.filter(p => p.post_id !== post.post_id));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('削除に失敗しました。');
        }
    };

    const startEdit = (post: Post) => {
        setEditingPostId(post.post_id);
        setEditCaption(post.caption);
    };

    const handleUpdate = async (postId: string) => {
        try {
            await updatePost(postId, { caption: editCaption });
            setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, caption: editCaption } : p));
            setEditingPostId(null);
        } catch (error) {
            console.error('Error updating post:', error);
            alert('更新に失敗しました。');
        }
    };

    const handleLike = async (post: Post) => {
        if (!user) {
            alert('いいねするにはログインが必要です。');
            return;
        }

        const isLiked = likedPosts.has(post.post_id);
        const newLikedPosts = new Set(likedPosts);

        if (isLiked) {
            newLikedPosts.delete(post.post_id);
            setPosts(prev => prev.map(p =>
                p.post_id === post.post_id ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p
            ));
        } else {
            newLikedPosts.add(post.post_id);
            setPosts(prev => prev.map(p =>
                p.post_id === post.post_id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
            ));
        }
        setLikedPosts(newLikedPosts);

        try {
            await toggleLikePost(post.post_id, user.uid);
        } catch (error) {
            console.error('Error liking post:', error);
            loadPosts(); // Revert
        }
    };

    const handleSave = async (post: Post) => {
        if (!user) {
            alert('保存するにはログインが必要です。');
            return;
        }

        try {
            const isSaved = await toggleSavePost(user.uid, post.post_id);
            await refreshFirestoreUser();
            alert(isSaved ? '投稿を保存しました！' : '保存を解除しました。');
        } catch (error) {
            console.error('Error saving post:', error);
            alert('保存に失敗しました。');
        }
    };

    const handleShare = async (post: Post) => {
        const shareData = {
            title: 'Mirutabi Reels',
            text: `Check out this reel by ${post.user_name} on Mirutabi!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('リンクをコピーしました！');
        }
    };

    const toggleComments = async (postId: string) => {
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null);
        } else {
            setActiveCommentPostId(postId);
            if (!comments[postId]) {
                setLoadingComments(true);
                try {
                    const fetchedComments = await getPostComments(postId);
                    setComments(prev => ({ ...prev, [postId]: fetchedComments }));
                } catch (error) {
                    console.error('Error loading comments:', error);
                } finally {
                    setLoadingComments(false);
                }
            }
        }
    };

    const submitComment = async (postId: string) => {
        if (!user || !newComment.trim()) return;

        try {
            const commentData = {
                post_id: postId,
                user_id: user.uid,
                user_name: firestoreUser?.display_name || user.displayName || 'User',
                user_image: firestoreUser?.photo_url || user.photoURL || undefined,
                content: newComment,
                created_at: Timestamp.now()
            };

            await addComment(commentData);

            const fetchedComments = await getPostComments(postId);
            setComments(prev => ({ ...prev, [postId]: fetchedComments }));
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('コメントの送信に失敗しました。');
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="h-screen bg-black overflow-y-scroll snap-y snap-mandatory" ref={containerRef}>
            {/* Back Button */}
            <button
                onClick={() => router.push('/')}
                className="fixed top-4 left-4 z-50 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition"
            >
                <ArrowLeft size={24} />
            </button>

            {posts.length === 0 ? (
                <div className="h-screen flex flex-col items-center justify-center text-white">
                    <p className="mb-4">まだリール動画がありません。</p>
                    <button
                        onClick={() => router.push('/create')}
                        className="bg-white text-black px-6 py-2 rounded-full font-bold"
                    >
                        動画を投稿する
                    </button>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.post_id} className="h-screen w-full snap-start relative flex items-center justify-center bg-gray-900">
                        <video
                            src={post.media_url}
                            className="w-full h-full object-cover md:object-contain"
                            loop
                            playsInline
                            muted // Start muted for auto-play policy
                            onClick={(e) => {
                                const v = e.currentTarget;
                                v.muted = !v.muted;
                            }}
                        />

                        {/* Overlay Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden mr-3 border-2 border-white">
                                        {post.user_image ? (
                                            <img src={post.user_image} alt={post.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold">
                                                {post.user_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-lg shadow-black drop-shadow-md">{post.user_name}</span>
                                </div>
                                {user && user.uid === post.user_id && (
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => startEdit(post)} className="bg-black/50 p-2 rounded-full text-sm hover:bg-white/20"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(post)} className="bg-black/50 p-2 rounded-full text-sm hover:bg-red-600/50"><Trash2 size={16} /></button>
                                    </div>
                                )}
                            </div>

                            {editingPostId === post.post_id ? (
                                <div className="mb-4 bg-black/50 p-2 rounded">
                                    <input
                                        type="text"
                                        value={editCaption}
                                        onChange={(e) => setEditCaption(e.target.value)}
                                        className="w-full bg-transparent border-b border-white mb-2 focus:outline-none"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => handleUpdate(post.post_id)} className="text-blue-400 text-sm font-bold">保存</button>
                                        <button onClick={() => setEditingPostId(null)} className="text-gray-400 text-sm">キャンセル</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm mb-4 line-clamp-2 shadow-black drop-shadow-md">{post.caption}</p>
                            )}

                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => handleLike(post)}
                                        className="flex flex-col items-center hover:scale-110 transition"
                                    >
                                        <Heart size={28} fill={likedPosts.has(post.post_id) ? "red" : "none"} className={likedPosts.has(post.post_id) ? "text-red-500" : "text-white"} />
                                        <span className="text-xs font-bold mt-1">{post.likes_count || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => toggleComments(post.post_id)}
                                        className="flex flex-col items-center hover:scale-110 transition"
                                    >
                                        <MessageCircle size={28} />
                                        <span className="text-xs font-bold mt-1">{comments[post.post_id]?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleSave(post)}
                                        className={`flex flex-col items-center hover:scale-110 transition ${firestoreUser?.saved_posts?.includes(post.post_id) ? 'text-blue-400' : 'text-white'}`}
                                    >
                                        <Bookmark size={28} fill={firestoreUser?.saved_posts?.includes(post.post_id) ? "currentColor" : "none"} />
                                    </button>
                                    <button
                                        onClick={() => handleShare(post)}
                                        className="flex flex-col items-center hover:scale-110 transition"
                                    >
                                        <Send size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* Comments Overlay */}
                            {activeCommentPostId === post.post_id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-black/90 rounded-t-2xl p-4 overflow-hidden flex flex-col animate-slide-up z-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">コメント</h3>
                                        <button onClick={() => setActiveCommentPostId(null)} className="text-gray-400 hover:text-white">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                        {loadingComments ? (
                                            <p className="text-gray-500 text-center">読み込み中...</p>
                                        ) : comments[post.post_id]?.length > 0 ? (
                                            comments[post.post_id].map(comment => (
                                                <div key={comment.comment_id} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {comment.user_image ? (
                                                            <img src={comment.user_image} alt={comment.user_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={16} className="text-white" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-300">{comment.user_name}</p>
                                                        <p className="text-sm text-white">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center">まだコメントはありません</p>
                                        )}
                                    </div>

                                    {user && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="コメントを追加..."
                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                                onKeyDown={(e) => e.key === 'Enter' && submitComment(post.post_id)}
                                            />
                                            <button
                                                onClick={() => submitComment(post.post_id)}
                                                disabled={!newComment.trim()}
                                                className="text-blue-500 font-bold text-sm disabled:opacity-50"
                                            >
                                                投稿
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
