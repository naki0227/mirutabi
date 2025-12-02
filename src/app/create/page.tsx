'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createPost, uploadPostMedia } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Camera, Sparkles, MapPin, X } from 'lucide-react';

export default function CreatePostPage() {
    const { user, firestoreUser, loading } = useAuth();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | undefined>(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');

    const [uploadProgress, setUploadProgress] = useState(0);

    // Google Maps Autocomplete
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    });

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        setAutocomplete(autocomplete);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location && place.name) {
                setLocation({
                    name: place.name,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setMediaType(selectedFile.type.startsWith('video') ? 'video' : 'photo');
        }
    };

    const handleSubmit = async () => {
        if (!user || !file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const mediaUrl = await uploadPostMedia(user.uid, file, (progress) => {
                setUploadProgress(Math.round(progress));
            });

            await createPost({
                user_id: user.uid,
                user_name: firestoreUser?.display_name || user.displayName || 'Anonymous',
                user_image: firestoreUser?.photo_url || user.photoURL || undefined,
                media_type: mediaType,
                media_url: mediaUrl,
                caption: caption,
                location: location,
                likes_count: 0,
                created_at: Timestamp.now()
            });

            alert('投稿しました！');
            router.push('/feed');
        } catch (error: any) {
            console.error('Error creating post:', error);
            alert(`投稿に失敗しました。\nエラー: ${error.message || '不明なエラー'}`);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-16">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <button onClick={() => router.back()} className="text-gray-600">キャンセル</button>
                    <h1 className="font-bold text-lg">新規投稿</h1>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="text-blue-600 font-bold disabled:opacity-50"
                    >
                        {isUploading ? `${uploadProgress}%` : 'シェア'}
                    </button>
                </div>

                {isUploading && (
                    <div className="w-full h-1 bg-gray-200">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                <div className="p-4">
                    <div className="mb-6">
                        {previewUrl ? (
                            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                                {mediaType === 'video' ? (
                                    <video src={previewUrl} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                )}
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setPreviewUrl(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label className="block w-full aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                                <Camera size={48} className="mb-2 text-gray-400" />
                                <span className="text-gray-600 font-bold">写真・動画を選択</span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">場所を追加</label>

                        {/* Auto Detect Button */}
                        {file && mediaType === 'photo' && !location && (
                            <button
                                onClick={async () => {
                                    if (!file) return;
                                    setIsUploading(true); // Reuse uploading state for loading indicator
                                    try {
                                        const reader = new FileReader();
                                        reader.readAsDataURL(file);
                                        reader.onload = async () => {
                                            const base64 = reader.result as string;
                                            const { analyzeImageForLocation } = await import('@/actions/vision');
                                            const result = await analyzeImageForLocation(base64);

                                            if (result && result.confidence > 0.6) {
                                                setLocation({
                                                    name: result.name,
                                                    lat: result.lat,
                                                    lng: result.lng
                                                });
                                            } else {
                                                alert('場所を特定できませんでした。手動で入力してください。');
                                            }
                                            setIsUploading(false);
                                        };
                                    } catch (e) {
                                        console.error(e);
                                        setIsUploading(false);
                                        alert('エラーが発生しました。');
                                    }
                                }}
                                className="mb-2 w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <span>解析中...</span>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> AIで場所を自動特定
                                    </>
                                )}
                            </button>
                        )}

                        {isLoaded && (
                            <Autocomplete
                                onLoad={onLoad}
                                onPlaceChanged={onPlaceChanged}
                            >
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="場所を検索..."
                                        className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        defaultValue={location?.name || ''}
                                    />
                                </div>
                            </Autocomplete>
                        )}
                        {location && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                                <span>Selected: <b>{location.name}</b></span>
                                <button
                                    onClick={() => setLocation(undefined)}
                                    className="text-gray-600 hover:text-red-500 ml-auto"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="キャプションを入力..."
                        className="w-full p-3 border rounded-lg min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
