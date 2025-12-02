'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost, updatePost, toggleLikePost, getPostLikeStatus, addComment, getPostComments, toggleSavePost } from '@/lib/db';
import { Post, Comment } from '@/types/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Heart, MessageCircle, Bookmark, Send, MapPin, Edit2, Trash2, Plus, User, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, firestoreUser, refreshFirestoreUser } = useAuth();
    const router = useRouter();

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
            const fetchedPosts = await getPosts(20);
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
            console.error('Error loading posts:', error);
            setLoading(false);
        }
    };

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
            await refreshFirestoreUser(); // Update local user state
            alert(isSaved ? '投稿を保存しました！' : '保存を解除しました。');
        } catch (error) {
            console.error('Error saving post:', error);
            alert('保存に失敗しました。');
        }
    };

    const handleShare = async (post: Post) => {
        const shareData = {
            title: 'Mirutabi Gram',
            text: `Check out this post by ${post.user_name} on Mirutabi!`,
            url: window.location.href, // Ideally link to specific post
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

            // Refresh comments
            const fetchedComments = await getPostComments(postId);
            setComments(prev => ({ ...prev, [postId]: fetchedComments }));
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('コメントの送信に失敗しました。');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-16">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold font-serif italic text-gray-800">Mirutabi Gram</h1>
                    </div>
                    <button
                        onClick={() => router.push('/create')}
                        className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.post_id} className="bg-white shadow-sm pb-4">
                            {/* User Header */}
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-3">
                                        {post.user_image ? (
                                            <img src={post.user_image} alt={post.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">
                                                {post.user_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-sm text-gray-800">{post.user_name}</span>
                                </div>
                                {user && user.uid === post.user_id && (
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(post)} className="text-gray-600 hover:text-blue-600 text-sm"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(post)} className="text-gray-600 hover:text-red-600 text-sm"><Trash2 size={16} /></button>
                                    </div>
                                )}
                            </div>

                            {/* Media */}
                            <div className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
                                {post.media_type === 'video' ? (
                                    <video
                                        src={post.media_url}
                                        controls
                                        className="w-full h-full object-contain"
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={post.media_url}
                                        alt="Post content"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-3 pt-3 flex gap-4">
                                <button
                                    onClick={() => handleLike(post)}
                                    className={`hover:scale-110 transition flex items-center gap-1 ${likedPosts.has(post.post_id) ? 'text-red-500' : 'text-gray-800'
                                        }`}
                                >
                                    <Heart size={24} fill={likedPosts.has(post.post_id) ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={() => toggleComments(post.post_id)}
                                    className="hover:scale-110 transition text-gray-800"
                                >
                                    <MessageCircle size={24} />
                                </button>
                                <button
                                    onClick={() => handleSave(post)}
                                    className={`hover:scale-110 transition ${firestoreUser?.saved_posts?.includes(post.post_id) ? 'text-blue-600' : 'text-gray-800'}`}
                                >
                                    <Bookmark size={24} fill={firestoreUser?.saved_posts?.includes(post.post_id) ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={() => handleShare(post)}
                                    className="hover:scale-110 transition text-gray-800"
                                >
                                    <Send size={24} />
                                </button>
                            </div>
                            <div className="px-3 pt-1">
                                <p className="text-sm font-bold text-gray-800">{post.likes_count || 0} いいね</p>
                            </div>

                            {/* Caption */}
                            <div className="px-3 py-2">
                                {editingPostId === post.post_id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editCaption}
                                            onChange={(e) => setEditCaption(e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm"
                                        />
                                        <button onClick={() => handleUpdate(post.post_id)} className="text-blue-600 text-sm font-bold">保存</button>
                                        <button onClick={() => setEditingPostId(null)} className="text-gray-600 text-sm">キャンセル</button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-800">
                                        <span className="font-bold mr-2">{post.user_name}</span>
                                        {post.caption}
                                    </p>
                                )}

                                {/* Location Link */}
                                {post.location && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-blue-600 mt-1 hover:underline"
                                    >
                                        <MapPin size={14} className="mr-1" />
                                        {post.location.name}
                                    </a>
                                )}

                                <p className="text-xs text-gray-500 mt-1">
                                    {post.created_at?.toDate().toLocaleDateString()}
                                </p>

                                {/* Comments Section */}
                                {activeCommentPostId === post.post_id && (
                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-sm text-gray-700">コメント</h3>
                                            <button onClick={() => setActiveCommentPostId(null)} className="text-gray-400 hover:text-gray-600">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                            {loadingComments ? (
                                                <p className="text-xs text-gray-500 text-center">読み込み中...</p>
                                            ) : comments[post.post_id]?.length > 0 ? (
                                                comments[post.post_id].map(comment => (
                                                    <div key={comment.comment_id} className="flex gap-2 text-sm">
                                                        <span className="font-bold text-gray-800 shrink-0">{comment.user_name}</span>
                                                        <p className="text-gray-600">{comment.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 text-center">まだコメントはありません</p>
                                            )}
                                        </div>

                                        {user && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="コメントを追加..."
                                                    className="flex-1 border rounded-full px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                    onKeyDown={(e) => e.key === 'Enter' && submitComment(post.post_id)}
                                                />
                                                <button
                                                    onClick={() => submitComment(post.post_id)}
                                                    disabled={!newComment.trim()}
                                                    className="text-blue-600 font-bold text-sm disabled:opacity-50"
                                                >
                                                    投稿
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {posts.length === 0 && (
                        <div className="text-center py-20 text-gray-600">
                            <p>まだ投稿がありません。</p>
                            <button
                                onClick={() => router.push('/create')}
                                className="mt-4 text-blue-600 font-bold"
                            >
                                最初の投稿を作成する
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
