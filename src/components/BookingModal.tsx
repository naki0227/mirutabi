'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
}

export default function BookingModal({ isOpen, onClose, destination }: BookingModalProps) {
    const [step, setStep] = useState<'searching' | 'options' | 'booking' | 'confirmed'>('searching');

    useEffect(() => {
        if (isOpen) {
            setStep('searching');
            setTimeout(() => setStep('options'), 1500);
        }
    }, [isOpen]);

    const handleBook = () => {
        setStep('booking');
        setTimeout(() => setStep('confirmed'), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold text-lg">⚡️ 3秒で予約</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
                </div>

                <div className="p-6 min-h-[300px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 'searching' && (
                            <motion.div
                                key="searching"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="font-bold text-gray-700">{destination} の最安値を検索中...</p>
                                <p className="text-sm text-gray-600">12サイトを比較中...</p>
                            </motion.div>
                        )}

                        {step === 'options' && (
                            <motion.div
                                key="options"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                <h3 className="font-bold text-gray-800 mb-2">おすすめのプラン:</h3>

                                <div onClick={handleBook} className="border-2 border-blue-500 bg-blue-50 p-4 rounded-xl cursor-pointer hover:bg-blue-100 transition relative">
                                    <span className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">おすすめ</span>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900">JAL + ホテルオークラ</span>
                                        <span className="font-bold text-blue-600">¥45,000</span>
                                    </div>
                                    <p className="text-xs text-gray-600">フライト: 10:00 AM • ホテル: 4.8★</p>
                                </div>

                                <div onClick={handleBook} className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900">ANA + ヒルトン</span>
                                        <span className="font-bold text-gray-800">¥52,000</span>
                                    </div>
                                    <p className="text-xs text-gray-600">フライト: 11:30 AM • ホテル: 4.5★</p>
                                </div>

                                <div onClick={handleBook} className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900">Peach + ゲストハウス</span>
                                        <span className="font-bold text-green-600">¥18,000</span>
                                    </div>
                                    <p className="text-xs text-gray-600">フライト: 06:00 AM • ホテル: 3.0★</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'booking' && (
                            <motion.div
                                key="booking"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                    <span className="text-3xl">💳</span>
                                </div>
                                <p className="font-bold text-gray-700">決済処理中...</p>
                                <p className="text-sm text-gray-600">ワンタップ予約を実行しています</p>
                            </motion.div>
                        )}

                        {step === 'confirmed' && (
                            <motion.div
                                key="confirmed"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-4xl font-bold">
                                    ✓
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800">予約完了！</h3>
                                    <p className="text-gray-600">{destination} への旅行が確定しました。</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
                                    <p><strong>注文ID:</strong> #TRIP-2024-8888</p>
                                    <p><strong>日程:</strong> 次の週末</p>
                                    <p><strong>合計:</strong> ¥45,000</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition"
                                >
                                    閉じる
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
