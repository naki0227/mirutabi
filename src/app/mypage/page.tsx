'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getUserRoutes,
    updateUser,
    getUser,
    updateRoute,
    uploadProfileImage
} from '@/lib/db';
import { Companion, TravelStyle, Route } from '@/types/firestore';
import { useRouter } from 'next/navigation';
import { Camera, Bookmark, Globe, Lock, ArrowRight, User, AlertTriangle, Plus, X } from 'lucide-react';
import { PREFECTURES } from '@/constants/locations';

export default function MyPage() {
    const { user, firestoreUser, loading, refreshFirestoreUser } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | undefined>(undefined);
    const [age, setAge] = useState<number | ''>('');
    const [residence, setResidence] = useState('');
    const [healthNotes, setHealthNotes] = useState('');

    // Companion State
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [newCompanion, setNewCompanion] = useState<Partial<Companion>>({
        name: '',
        relationship: '',
        age: 0,
        gender: 'male',
        health_notes: ''
    });
    const [isAddingCompanion, setIsAddingCompanion] = useState(false);

    // Tag State
    const PRESET_TAGS = ['温泉', 'カフェ巡り', '美術館', '絶景', '歴史', 'グルメ', 'ショッピング', '自然', 'テーマパーク', 'パワースポット'];
    const [tags, setTags] = useState<string[]>([]);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [newCustomTag, setNewCustomTag] = useState('');

    const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);

    // Derived State
    const profileImage = firestoreUser?.photo_url || user?.photoURL;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (firestoreUser) {
            setDisplayName(firestoreUser.display_name || user?.displayName || '');
            setGender(firestoreUser.gender);
            setAge(firestoreUser.age || '');
            setResidence(firestoreUser.residence || '');
            setHealthNotes(firestoreUser.health_notes || '');
            setCompanions(firestoreUser.companions || []);
            setTags(firestoreUser.tags || []);

            // Fetch saved routes
            getUserRoutes(firestoreUser.user_id).then((routes: Route[]) => {
                setSavedRoutes(routes);
            }).catch((err: any) => console.error('Error fetching routes:', err));
        }
    }, [user, firestoreUser, loading, router]);

    const handleSaveProfile = async () => {
        if (!user) return;
        try {
            await updateUser(user.uid, {
                display_name: displayName,
                gender: gender,
                age: age === '' ? undefined : Number(age),
                residence: residence,
                health_notes: healthNotes,
            });
            await refreshFirestoreUser();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('プロフィールの更新に失敗しました。');
        }
    };

    const handleSaveTags = async () => {
        if (!user) return;
        try {
            await updateUser(user.uid, { tags: tags });
            await refreshFirestoreUser();
            setIsEditingTags(false);
        } catch (error) {
            console.error('Error updating tags:', error);
            alert('タグの更新に失敗しました。');
        }
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleAddCustomTag = () => {
        if (newCustomTag && !tags.includes(newCustomTag)) {
            setTags([...tags, newCustomTag]);
            setNewCustomTag('');
        }
    };

    const handleAddCompanion = async () => {
        if (!user || !newCompanion.name) return;
        try {
            const updatedCompanions = [...companions, newCompanion as Companion];
            await updateUser(user.uid, { companions: updatedCompanions });
            await refreshFirestoreUser();
            setCompanions(updatedCompanions);
            setNewCompanion({ name: '', relationship: '', age: 0, gender: 'male', health_notes: '' });
            setIsAddingCompanion(false);
        } catch (error) {
            console.error('Error adding companion:', error);
            alert('お連れ様の追加に失敗しました。');
        }
    };

    const handleDeleteCompanion = async (index: number) => {
        if (!user) return;
        if (!confirm('本当に削除しますか？')) return;
        try {
            const updatedCompanions = companions.filter((_, i) => i !== index);
            await updateUser(user.uid, { companions: updatedCompanions });
            await refreshFirestoreUser();
            setCompanions(updatedCompanions);
        } catch (error) {
            console.error('Error deleting companion:', error);
            alert('削除に失敗しました。');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            try {
                await uploadProfileImage(user.uid, file);
                await refreshFirestoreUser();
                // Force reload to ensure auth profile updates are reflected if needed, 
                // though refreshFirestoreUser should handle the Firestore part.
                // window.location.reload(); 
            } catch (error) {
                console.error('Error uploading profile image:', error);
                alert('画像のアップロードに失敗しました。');
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user || !firestoreUser) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">マイページ</h1>

                {/* Travel Style Card */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">トラベルスタイル診断結果</h2>
                    {firestoreUser.style_result ? (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-2">あなたのスタイルは...</p>
                            <div className="text-4xl font-bold text-blue-600 mb-4">{firestoreUser.style_result}</div>
                            <button
                                onClick={() => router.push('/diagnosis')}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                診断をやり直す
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">まだ診断を受けていません。</p>
                            <button
                                onClick={() => router.push('/diagnosis')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                            >
                                診断を受ける
                            </button>
                        </div>
                    )}
                </div>

                {/* Profile Card */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-gray-800">基本プロフィール</h2>
                        <button
                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            className={`px-4 py-1 rounded-full text-sm font-bold transition ${isEditing
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {isEditing ? '保存' : '編集'}
                        </button>
                    </div>

                    <div className="flex items-center space-x-6 mb-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                                        {displayName ? displayName[0] : 'U'}
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                                <Camera size={24} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">表示名（ニックネーム）</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="表示名を入力"
                                    />
                                ) : (
                                    <p className="text-lg text-gray-800 font-bold">
                                        {displayName || '未設定'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">性別</label>
                            {isEditing ? (
                                <select
                                    value={gender || ''}
                                    onChange={(e) => setGender(e.target.value as any)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">未設定</option>
                                    <option value="male">男性</option>
                                    <option value="female">女性</option>
                                    <option value="other">その他</option>
                                </select>
                            ) : (
                                <p className="text-lg text-gray-800">
                                    {gender === 'male' ? '男性' : gender === 'female' ? '女性' : gender === 'other' ? 'その他' : '未設定'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">年齢</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="年齢を入力"
                                />
                            ) : (
                                <p className="text-lg text-gray-800">{age ? `${age}歳` : '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">居住地</label>
                            {isEditing ? (
                                <select
                                    value={residence}
                                    onChange={(e) => setResidence(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">選択してください</option>
                                    {PREFECTURES.map((pref) => (
                                        <option key={pref} value={pref}>
                                            {pref}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-lg text-gray-800">{residence || '未設定'}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-1">健康状態・配慮事項</label>
                            {isEditing ? (
                                <textarea
                                    value={healthNotes}
                                    onChange={(e) => setHealthNotes(e.target.value)}
                                    className="w-full p-2 border rounded-lg h-24"
                                    placeholder="例：足が悪いため、階段は避けたい。アレルギーありなど。"
                                />
                            ) : (
                                <p className="text-lg text-gray-800 whitespace-pre-wrap">
                                    {healthNotes || '特になし'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Companions Card */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-gray-800">お連れ様情報</h2>
                        <button
                            onClick={() => setIsAddingCompanion(true)}
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-200 transition"
                        >
                            <Plus size={16} className="mr-1" /> 追加
                        </button>
                    </div>

                    {isAddingCompanion && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-blue-200">
                            <h3 className="font-bold text-gray-700 mb-3">新規登録</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="名前/ニックネーム"
                                    className="p-2 border rounded"
                                    value={newCompanion.name}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, name: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="続柄 (例: 妻, 子供)"
                                    className="p-2 border rounded"
                                    value={newCompanion.relationship}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, relationship: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="年齢"
                                    className="p-2 border rounded"
                                    value={newCompanion.age || ''}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, age: Number(e.target.value) })}
                                />
                                <select
                                    className="p-2 border rounded"
                                    value={newCompanion.gender}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, gender: e.target.value as any })}
                                >
                                    <option value="male">男性</option>
                                    <option value="female">女性</option>
                                    <option value="other">その他</option>
                                </select>
                                <textarea
                                    placeholder="健康状態・配慮事項"
                                    className="p-2 border rounded md:col-span-2"
                                    value={newCompanion.health_notes}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, health_notes: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsAddingCompanion(false)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleAddCompanion}
                                    disabled={!newCompanion.name}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {companions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">登録されているお連れ様はいません。</p>
                        ) : (
                            companions.map((comp, index) => (
                                <div key={index} className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-800">{comp.name}</span>
                                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{comp.relationship}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {comp.age}歳 / {comp.gender === 'male' ? '男性' : comp.gender === 'female' ? '女性' : 'その他'}
                                        </div>
                                        {comp.health_notes && (
                                            <div className="text-sm text-red-500 mt-1">
                                                <AlertTriangle size={14} className="mr-1" /> {comp.health_notes}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCompanion(index)}
                                        className="text-red-400 hover:text-red-600 text-sm"
                                    >
                                        削除
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Interest Tags Card */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-gray-800">興味・関心タグ</h2>
                        <button
                            onClick={() => isEditingTags ? handleSaveTags() : setIsEditingTags(true)}
                            className={`px-4 py-1 rounded-full text-sm font-bold transition ${isEditingTags
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {isEditingTags ? '保存' : '編集'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">プリセットタグ</h3>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        disabled={!isEditingTags}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1 rounded-full text-sm transition ${tags.includes(tag)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">カスタムタグ</h3>
                            {isEditingTags && (
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newCustomTag}
                                        onChange={(e) => setNewCustomTag(e.target.value)}
                                        placeholder="タグを入力 (例: 御朱印, 激辛)"
                                        className="flex-1 p-2 border rounded-lg"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                    />
                                    <button
                                        onClick={handleAddCustomTag}
                                        disabled={!newCustomTag}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                                    >
                                        追加
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                                    <span key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                                        {tag}
                                        {isEditingTags && (
                                            <button onClick={() => toggleTag(tag)} className="ml-2 text-purple-600 hover:text-purple-900"><X size={14} /></button>
                                        )}
                                    </span>
                                ))}
                                {tags.filter(t => !PRESET_TAGS.includes(t)).length === 0 && (
                                    <span className="text-gray-400 text-sm">カスタムタグはありません</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Plans Card */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-gray-800">保存したプラン</h2>
                        <button
                            onClick={() => router.push('/saved')}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <Bookmark size={16} /> 保存した投稿を見る
                        </button>
                    </div>
                    {savedRoutes.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">保存されたプランはありません。</p>
                    ) : (
                        <div className="space-y-4">
                            {savedRoutes.map((route) => (
                                <div
                                    key={route.route_id}
                                    onClick={() => {
                                        if (route.route_id) {
                                            router.push(`/plan/${route.route_id}`);
                                        } else {
                                            console.error('Route ID is missing for route:', route);
                                            alert('プランIDが見つかりません。');
                                        }
                                    }}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{route.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                作成日: {route.created_at?.toDate().toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {route.stops.length}箇所のスポット / 合計: ¥{route.stops.reduce((sum, stop) => sum + (stop.cost_estimate || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-blue-500 text-sm font-bold flex items-center gap-1">
                                                詳細を見る <ArrowRight size={14} />
                                            </div>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm(route.is_public ? '非公開にしますか？' : '公開しますか？')) return;
                                                    try {
                                                        const newStatus = !route.is_public;
                                                        await import('@/lib/db').then(mod => mod.updateRoute(route.route_id, { is_public: newStatus }));
                                                        setSavedRoutes(prev => prev.map(r =>
                                                            r.route_id === route.route_id ? { ...r, is_public: newStatus } : r
                                                        ));
                                                    } catch (err) {
                                                        console.error('Error updating status:', err);
                                                        alert('更新に失敗しました。');
                                                    }
                                                }}
                                                className={`text-xs px-2 py-1 rounded border transition hover:opacity-80 ${route.is_public
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                                    }`}
                                            >

                                                {route.is_public ? <span className="flex items-center gap-1">公開中 <Globe size={12} /></span> : <span className="flex items-center gap-1">非公開 <Lock size={12} /></span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="text-center py-6">
                    <button
                        onClick={() => router.push('/terms')}
                        className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
                    >
                        利用規約・免責事項
                    </button>
                </div>
            </div>
        </div>
    );
}
