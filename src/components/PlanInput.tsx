'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Compass, Camera, Sparkles, MapPin, Clock, Navigation, Target, Music } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWeather } from '@/actions/weather';
import { getAuthUrl, getSpotifyUserData } from '@/actions/spotify';

interface PlanInputProps {
    onSubmit: (
        input: string,
        isMultilingual: boolean,
        transportModes: string[],
        group: { adults: number; children: number; infants: number },
        budget: { amount: string; type: 'total' | 'per_person' }
    ) => void;
    isLoading: boolean;
}

export default function PlanInput({ onSubmit, isLoading }: PlanInputProps) {
    const { firestoreUser } = useAuth();
    const [mode, setMode] = useState<'free' | 'compass' | 'photo' | 'concierge' | 'dart'>('free');

    // Free Input State
    const [input, setInput] = useState('');

    // Compass Input State
    const [direction, setDirection] = useState<string>('');
    const [timeValue, setTimeValue] = useState<string>('2');
    const [timeUnit, setTimeUnit] = useState<string>('hours');
    const [startPoint, setStartPoint] = useState<string>('東京');
    const [compassTheme, setCompassTheme] = useState<string>('');

    // Dart Input State
    const [dartRange, setDartRange] = useState<string>('nationwide');

    // Photo Input State
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [identifiedSpots, setIdentifiedSpots] = useState<{ name: string; description: string }[]>([]);
    const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);

    // Concierge Input State (Mock Data)
    const [conciergeData, setConciergeData] = useState({
        health: { steps: 8500, stamina: 'medium' },
        sns: { music: ['Jazz', 'Lo-Fi'], food: ['Ramen', 'Matcha Sweets'] },
        weather: '読み込み中...',
        temperature: ''
    });
    const [spotifyData, setSpotifyData] = useState<{ isConnected: boolean; topArtists: string[]; topTracks: string[] } | null>(null);

    // Shared State
    const [departureCity, setDepartureCity] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [budgetType, setBudgetType] = useState<'total' | 'per_person'>('per_person');

    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);

    const [isMultilingual, setIsMultilingual] = useState(false);
    const [transportModes, setTransportModes] = useState<string[]>(['flight', 'shinkansen']);
    const [avoidCrowds, setAvoidCrowds] = useState(false);

    useEffect(() => {
        if (firestoreUser?.residence) {
            setStartPoint(firestoreUser.residence);
            setDepartureCity(firestoreUser.residence);
        }
    }, [firestoreUser]);

    useEffect(() => {
        if (mode === 'concierge') {
            const fetchWeather = async () => {
                const userCity = firestoreUser?.residence;
                let data = null;

                if (userCity) {
                    data = await getWeather(userCity);
                }

                if (!data) {
                    // Fallback to Tokyo if user city fails or is not set
                    data = await getWeather('Tokyo');
                }

                if (data) {
                    setConciergeData(prev => ({
                        ...prev,
                        weather: data.weather,
                        temperature: data.temperature
                    }));
                } else {
                    setConciergeData(prev => ({
                        ...prev,
                        weather: '天気情報の取得に失敗しました',
                        temperature: ''
                    }));
                }
            };

            fetchWeather();
        }
    }, [mode, firestoreUser]);

    useEffect(() => {
        const checkSpotify = async () => {
            const data = await getSpotifyUserData();
            if (data) {
                setSpotifyData(data);
                setConciergeData(prev => ({
                    ...prev,
                    sns: { ...prev.sns, music: data.topArtists.slice(0, 3) } // Use top 3 artists as music preference
                }));
            }
        };
        checkSpotify();
    }, []);

    const handleConnectSpotify = async () => {
        const url = await getAuthUrl();
        if (url) {
            window.location.href = url;
        } else {
            alert('Spotify連携の設定がされていません。');
        }
    };

    const handleTransportChange = (mode: string) => {
        setTransportModes(prev =>
            prev.includes(mode)
                ? prev.filter(m => m !== mode)
                : [...prev, mode]
        );
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setPhotoFiles(prev => [...prev, ...files]);

            setIsAnalyzingPhotos(true);
            try {
                const base64s = await Promise.all(files.map(file => new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                })));

                const { analyzeImagesForTrip } = await import('@/actions/vision');
                const results = await analyzeImagesForTrip(base64s);
                setIdentifiedSpots(prev => [...prev, ...results]);
            } catch (error) {
                console.error('Error analyzing photos:', error);
                alert('画像の解析に失敗しました。');
            } finally {
                setIsAnalyzingPhotos(false);
            }
        }
    };

    const removeSpot = (index: number) => {
        setIdentifiedSpots(prev => prev.filter((_, i) => i !== index));
    };

    const directions = [
        { id: 'North', label: '北', angle: 0 },
        { id: 'NorthEast', label: '北東', angle: 45 },
        { id: 'East', label: '東', angle: 90 },
        { id: 'SouthEast', label: '南東', angle: 135 },
        { id: 'South', label: '南', angle: 180 },
        { id: 'SouthWest', label: '南西', angle: 225 },
        { id: 'West', label: '西', angle: 270 },
        { id: 'NorthWest', label: '北西', angle: 315 },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalInput = input;

        if (mode === 'free') {
            if (!input.trim()) return;
            finalInput = input;
            if (departureCity) finalInput += `\n出発地: ${departureCity}`;
        } else if (mode === 'compass') {
            if (!direction) {
                alert('方向を選択してください');
                return;
            }
            finalInput = `Compass Trip: From ${startPoint} go ${direction} (${directions.find(d => d.id === direction)?.label}方面) for approx ${timeValue} ${timeUnit}.`;
            if (compassTheme) finalInput += ` Theme: ${compassTheme}.`;
        } else if (mode === 'photo') {
            if (identifiedSpots.length === 0) {
                alert('写真からスポットを特定できませんでした。');
                return;
            }
            const spotNames = identifiedSpots.map(s => s.name).join(', ');
            finalInput = `Photo Trip: I want to visit these spots: ${spotNames}. User Request: ${input}`;
        } else if (mode === 'concierge') {
            finalInput = `Concierge Trip:
            Health: ${conciergeData.health.steps} steps / day, Stamina: ${conciergeData.health.stamina}.
            SNS Likes: Music = [${conciergeData.sns.music.join(', ')}], Food = [${conciergeData.sns.food.join(', ')}].
            Weather Forecast: ${conciergeData.weather} ${conciergeData.temperature}.
            User Request: ${input} `;
        } else if (mode === 'dart') {
            const startLocation = departureCity || 'Tokyo';
            finalInput = `Dart Trip: From ${startLocation}. Randomly select a destination in ${dartRange}. User Request: ${input}`;
        }

        if (avoidCrowds) {
            finalInput += " [Avoid Crowds]";
        }

        onSubmit(
            finalInput,
            isMultilingual,
            transportModes,
            { adults, children, infants },
            { amount: budgetAmount, type: budgetType }
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">

            {/* Mode Switcher */}
            <div className="flex mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setMode('free')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'free' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <MessageSquare size={16} /> フリー
                </button>
                <button
                    type="button"
                    onClick={() => setMode('compass')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'compass' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <Compass size={16} /> コンパス
                </button>
                <button
                    type="button"
                    onClick={() => setMode('photo')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'photo' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <Camera size={16} /> 写真
                </button>
                <button
                    type="button"
                    onClick={() => setMode('concierge')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'concierge' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <Sparkles size={16} /> コンシェルジュ
                </button>
                <button
                    type="button"
                    onClick={() => setMode('dart')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'dart' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <Target size={16} /> ダーツ
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'free' && (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">どんな旅行にしますか？</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">出発地 (任意)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                placeholder="例: 東京"
                                value={departureCity}
                                onChange={(e) => setDepartureCity(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">旅行の要望</label>
                            <textarea
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 text-gray-700"
                                placeholder="例：来月、温泉でゆっくりしたい。美味しい魚料理も食べたい。"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </>
                )}

                {mode === 'compass' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">方角と距離で決める旅</h2>
                            <p className="text-sm text-gray-600">「西へ2時間」のような直感的な旅を提案します</p>
                        </div>

                        {/* Compass UI */}
                        <div className="relative w-64 h-64 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                            {/* Center Point */}
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="text-center bg-white/80 backdrop-blur-sm p-2 rounded-lg">
                                    <span className="block text-xs text-gray-600">START</span>
                                    <input
                                        type="text"
                                        value={startPoint}
                                        onChange={(e) => setStartPoint(e.target.value)}
                                        className="w-20 text-center font-bold text-gray-800 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none pointer-events-auto"
                                    />
                                </div>
                            </div>

                            {directions.map((d) => {
                                const isSelected = direction === d.id;
                                const rad = (d.angle - 90) * (Math.PI / 180);
                                const radius = 100; // distance from center
                                const x = 128 + radius * Math.cos(rad);
                                const y = 128 + radius * Math.sin(rad);

                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setDirection(d.id)}
                                        className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all transform hover:scale-110 ${isSelected
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-200 z-20 scale-110'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                        style={{ left: `${x}px`, top: `${y}px` }}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Distance/Time Input */}
                        <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-bold">片道</span>
                                <input
                                    type="number"
                                    value={timeValue}
                                    onChange={(e) => setTimeValue(e.target.value)}
                                    className="w-16 p-2 text-center border border-gray-300 rounded-lg font-bold text-lg"
                                />
                            </div>
                            <select
                                value={timeUnit}
                                onChange={(e) => setTimeUnit(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="hours">時間</option>
                                <option value="minutes">分</option>
                                <option value="km">km</option>
                            </select>
                            <span className="text-gray-600">くらいの場所</span>
                        </div>

                        {/* Theme Chips */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">気分のテーマ (任意)</label>
                            <div className="flex flex-wrap gap-2">
                                {['温泉', '海', '山', 'グルメ', '歴史', '都会'].map(theme => (
                                    <button
                                        key={theme}
                                        type="button"
                                        onClick={() => setCompassTheme(prev => prev === theme ? '' : theme)}
                                        className={`px-3 py-1 rounded-full text-sm border transition ${compassTheme === theme
                                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'photo' && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex justify-center mb-2">
                                <Camera size={48} className="text-gray-400" />
                            </div>
                            <p className="font-bold text-gray-600">SNSのスクショや写真をアップロード</p>
                            <p className="text-xs text-gray-500 mt-1">AIが場所を特定してプランを作成します</p>
                        </div>

                        {isAnalyzingPhotos && (
                            <div className="text-center text-blue-600 text-sm font-bold animate-pulse">
                                🔍 写真を解析中...
                            </div>
                        )}

                        {identifiedSpots.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-700">特定されたスポット:</p>
                                {identifiedSpots.map((spot, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                        <div>
                                            <p className="font-bold text-sm text-blue-800">{spot.name}</p>
                                            <p className="text-xs text-blue-600">{spot.description}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSpot(idx)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'concierge' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                            <h2 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                                <Sparkles className="mr-2 text-purple-600" />
                                AIコンシェルジュがデータを分析中
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">❤️</span>
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">ヘルスケア連携</p>
                                            <p className="text-sm font-bold text-gray-800">平均 {conciergeData.health.steps.toLocaleString()}歩 / スタミナ: {conciergeData.health.stamina}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Synced</span>
                                </div>

                                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🎵</span>
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">SNSの好み</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                Music: {spotifyData ? spotifyData.topArtists.slice(0, 3).join(', ') : conciergeData.sns.music.join(', ')} / Food: {conciergeData.sns.food.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    {spotifyData ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Connected</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleConnectSpotify}
                                            className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full transition flex items-center gap-1"
                                        >
                                            <Music size={12} /> Connect Spotify
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">☔️</span>
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">天気予報 ({firestoreUser?.residence || 'Tokyo'})</p>
                                            <p className="text-sm font-bold text-gray-800">{conciergeData.weather}</p>
                                            <p className="text-xs text-gray-500">{conciergeData.temperature}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Synced</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">追加のリクエスト (任意)</label>
                            <textarea
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24 text-gray-700"
                                placeholder="例：彼女の誕生日祝いも兼ねて、少しリッチにしたい。"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                )}

                {mode === 'dart' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">ダーツの旅</h2>
                            <p className="text-sm text-gray-600">行き先を運に任せて、新しい発見を。</p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl text-center">
                            <Target size={64} className="mx-auto text-blue-500 mb-4" />
                            <label className="block text-sm font-bold text-gray-700 mb-3">範囲を選択</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'nationwide', label: '全国' },
                                    { id: 'asia', label: 'アジア' },
                                    { id: 'america', label: 'アメリカ' },
                                    { id: 'europe', label: 'ヨーロッパ' },
                                    { id: 'world', label: '世界中' }
                                ].map((range) => (
                                    <button
                                        key={range.id}
                                        type="button"
                                        onClick={() => setDartRange(range.id)}
                                        className={`p-3 rounded-lg font-bold text-sm transition ${dartRange === range.id
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">旅のテーマや要望 (任意)</label>
                            <textarea
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 text-gray-700"
                                placeholder="例：美味しいものを食べたい、絶景が見たいなど"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                )}

                {/* Common Options */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="avoidCrowds"
                            checked={avoidCrowds}
                            onChange={(e) => setAvoidCrowds(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="avoidCrowds" className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-1">
                            <span className="text-blue-500">🛡️</span> 混雑を避ける (穴場・時間帯を考慮)
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">予算上限 (任意)</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                    placeholder="例: 50000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                                <select
                                    value={budgetType}
                                    onChange={(e) => setBudgetType(e.target.value as 'total' | 'per_person')}
                                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm"
                                    disabled={isLoading}
                                >
                                    <option value="per_person">一人当たり</option>
                                    <option value="total">全体</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">人数構成</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">大人</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                        value={adults}
                                        onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">子供</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                        value={children}
                                        onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">幼児</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                        value={infants}
                                        onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">移動手段 (複数選択可)</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={transportModes.includes('flight')}
                                    onChange={() => handleTransportChange('flight')}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-gray-700">飛行機</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={transportModes.includes('shinkansen')}
                                    onChange={() => handleTransportChange('shinkansen')}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-gray-700">新幹線</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={transportModes.includes('bus')}
                                    onChange={() => handleTransportChange('bus')}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-gray-700">夜行バス</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isMultilingual}
                            onChange={(e) => setIsMultilingual(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            disabled={isLoading}
                        />
                        <span className="text-sm text-gray-600">全言語で生成する (JA/EN/ZH/KO)</span>
                    </label>
                    <button
                        type="submit"
                        disabled={(mode === 'free' ? !input.trim() : mode === 'compass' ? !direction : mode === 'photo' ? identifiedSpots.length === 0 : false) || isLoading}
                        className={`px-8 py-3 rounded-full font-bold text-white transition transform hover:scale-105 ${(mode === 'free' ? !input.trim() : mode === 'compass' ? !direction : mode === 'photo' ? identifiedSpots.length === 0 : false) || isLoading
                            ? 'bg-gray-400 cursor-not-allowed transform-none'
                            : mode === 'concierge' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg hover:shadow-xl' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {isLoading ? 'プラン作成中...' : mode === 'concierge' ? 'コンシェルジュに依頼' : 'プランを作成する'}
                    </button>
                </div>
            </form>
        </div>
    );
}
