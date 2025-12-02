'use client';

import { useState } from 'react';
import HotelSwipe from '@/components/HotelSwipe';
import { Hotel } from '@/types/hotel';
import { analyzeHotelPreferences } from '@/actions/hotel';

interface Recommendation {
    name: string;
    location: string;
    reason: string;
    tags: string[];
}

interface AnalysisResult {
    personality: string;
    description: string;
    recommendations: Recommendation[];
}

export default function HotelMatchPage() {
    const [step, setStep] = useState<'swipe' | 'analyzing' | 'result'>('swipe');
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleFinish = async (likedHotels: Hotel[]) => {
        setStep('analyzing');
        try {
            const analysis = await analyzeHotelPreferences(likedHotels);
            setResult(analysis);
            setStep('result');
        } catch (error) {
            console.error(error);
            alert('分析に失敗しました。もう一度お試しください。');
            setStep('swipe');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">AI ホテルマッチ 🔥</h1>
                    <p className="text-gray-500">気になるホテルを右スワイプ。<br />AIがあなたにぴったりの宿を見つけます。</p>
                </header>

                {step === 'swipe' && (
                    <HotelSwipe onFinish={handleFinish} />
                )}

                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xl font-bold text-gray-700">好みを分析中...</p>
                        <p className="text-sm text-gray-500">あなただけの隠れ家を探しています</p>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-2 border-blue-100">
                            <p className="text-sm font-bold text-blue-500 mb-2">あなたのトラベル性格診断</p>
                            <h2 className="text-3xl font-black text-gray-800 mb-4">{result.personality}</h2>
                            <p className="text-gray-600 leading-relaxed">{result.description}</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-800 ml-2">おすすめのホテル</h3>
                            {result.recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-900">{rec.name}</h4>
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {rec.location}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                                    <div className="flex gap-2">
                                        {rec.tags.map(tag => (
                                            <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep('swipe')}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition"
                        >
                            もう一度試す
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
