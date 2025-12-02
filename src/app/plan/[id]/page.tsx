'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRoute, updateRoute, addComment, getComments, uploadRouteImage } from '@/lib/db';
import { Route, RouteStop, Comment } from '@/types/firestore';
import RouteTimeline from '@/components/RouteTimeline';
import PlanChat from '@/components/PlanChat';
import MapComponent from '@/components/MapComponent';
import { useReactToPrint } from 'react-to-print';
import { Timestamp } from 'firebase/firestore';
import { Save, Printer, Camera, MessageCircle, ArrowLeft, Plus, User } from 'lucide-react';

export default function PlanDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, firestoreUser, loading: authLoading } = useAuth(); // Renamed authLoading to avoid conflict
    const [route, setRoute] = useState<Route | null>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [loading, setLoading] = useState(true); // Component's internal loading state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Comments & Photos State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (id && typeof id === 'string') {
            getRoute(id).then(fetchedRoute => {
                console.log('Fetched Route:', fetchedRoute); // Debug log
                if (fetchedRoute) {
                    // Check ownership or public status
                    console.log('User ID:', user?.uid); // Debug log
                    console.log('Creator ID:', fetchedRoute.creator_id); // Debug log
                    console.log('Is Public:', fetchedRoute.is_public); // Debug log

                    if (user && fetchedRoute.creator_id !== user.uid && !fetchedRoute.is_public) {
                        console.log('Permission denied'); // Debug log
                        alert('このプランを表示する権限がありません。');
                        router.push('/mypage');
                        return;
                    }
                    setRoute(fetchedRoute);
                    setStops(fetchedRoute.stops);
                } else {
                    console.log('Route not found'); // Debug log
                    alert('プランが見つかりませんでした。');
                    router.push('/mypage');
                }
            }).catch(err => console.error('Error fetching route:', err));
        }
    }, [id, user, loading, router]);

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: route?.title || 'Travel Plan',
    });

    const handleUpdate = async () => {
        if (!route || !id) return;
        setIsSaving(true);
        try {
            await updateRoute(id as string, {
                stops: stops,
                updated_at: Timestamp.now()
            });
            alert('プランを更新しました！');
        } catch (e) {
            console.error('Error updating plan:', e);
            alert('更新に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !route) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            const downloadURL = await uploadRouteImage(route.route_id, file);
            setRoute(prev => prev ? { ...prev, images: [...(prev.images || []), downloadURL] } : null);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('画像のアップロードに失敗しました。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user || !route) return;
        try {
            const commentData = {
                route_id: route.route_id,
                user_id: user.uid,
                user_name: firestoreUser?.display_name || user.displayName || '匿名ユーザー',
                user_image: firestoreUser?.photo_url || user.photoURL || undefined,
                content: newComment,
                created_at: Timestamp.now()
            };
            await addComment(commentData);
            setComments(prev => [{ ...commentData, comment_id: 'temp-' + Date.now() } as Comment, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('コメントの投稿に失敗しました。');
        }
    };

    if (loading || !route) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{route.title}</h1>
                        <p className="text-gray-200 mt-2">作成日: {route.created_at?.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/mypage')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> 戻る
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2 disabled:bg-gray-500"
                        >
                            <Save size={16} /> <span>{isSaving ? '保存中...' : '上書き保存'}</span>
                        </button>
                        <button
                            onClick={() => handlePrint()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
                        >
                            <Printer size={16} /> <span>PDF出力</span>
                        </button>
                    </div>
                </div>

                <div ref={componentRef} className="bg-white/5 p-4 rounded-xl mb-8">
                    <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-white/10">
                        <MapComponent stops={stops} />
                    </div>
                    <div className="print:text-black print:bg-white">
                        <RouteTimeline stops={stops} isMultilingual={false} />
                    </div>
                </div>

                {/* Photos Section */}
                <div className="bg-white/5 p-6 rounded-xl mb-8 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">フォトギャラリー <Camera size={24} /></h2>
                        {user && route && user.uid === route.creator_id && (
                            <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition flex items-center gap-1 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isUploading ? 'アップロード中...' : <><Plus size={16} /> 写真を追加</>}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        )}
                    </div>

                    {route?.images && route.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {route.images.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group">
                                    <img src={img} alt={`Trip photo ${idx + 1}`} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-300 py-8 border-2 border-dashed border-white/10 rounded-lg">
                            まだ写真はありません。思い出の写真を共有しましょう！
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">コメント <MessageCircle size={24} /></h2>

                    {user && (
                        <div className="flex gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                                {firestoreUser?.display_name?.[0] || user.displayName?.[0] || <User size={20} />}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="このプランへの感想や質問を投稿..."
                                    className="w-full bg-white/10 text-white rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        投稿する
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-gray-300 text-center">まだコメントはありません。</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.comment_id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden">
                                        {comment.user_image ? (
                                            <img src={comment.user_image} alt={comment.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-bold text-white">{comment.user_name}</span>
                                            <span className="text-xs text-gray-300">
                                                {comment.created_at?.toDate ? comment.created_at.toDate().toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <PlanChat stops={stops} onPlanUpdate={setStops} />
            </div>
        </div>
    );
}
