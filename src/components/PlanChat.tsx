'use client';

import { useState, useRef, useEffect } from 'react';
import { RouteStop } from '@/types/firestore';
import { GeneratedStop } from '@/actions/plan';
import { chatWithPlan } from '@/actions/chat';

interface PlanChatProps {
    stops: RouteStop[];
    onPlanUpdate: (updatedStops: RouteStop[]) => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function PlanChat({ stops, onPlanUpdate }: PlanChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'プランについて何か変更したい点はありますか？「ホテルを安くして」「ランチを追加して」など、お気軽にどうぞ。' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Convert RouteStop back to GeneratedStop for the server action
            // Note: Timestamps need to be handled carefully if we were sending them back,
            // but here we are sending the structure that the AI understands.
            // Ideally, we should keep the GeneratedStop structure or map it properly.
            // For simplicity, we'll map essential fields.
            const currentStopsForAI: GeneratedStop[] = stops.map(s => ({
                spot_id: s.spot_id,
                order: s.order,
                type: s.type || 'other',
                notes: s.notes || '',
                notes_en: s.notes_en,
                notes_zh: s.notes_zh,
                notes_ko: s.notes_ko,
                arrival_time_iso: s.arrival_time?.toDate().toISOString(),
                departure_time_iso: s.departure_time?.toDate().toISOString(),
                cost_estimate: s.cost_estimate,
                cost_estimate_usd: s.cost_estimate_usd,
                details: s.details,
                booking_url: s.booking_url,
                recommended_date: s.recommended_date,
                time_zone: s.time_zone,
                alternatives: s.alternatives as any // Type assertion for simplicity
            }));

            const language = navigator.language || 'ja';
            const response = await chatWithPlan(currentStopsForAI, userMessage, [], language);
            console.log('Chat response:', response);

            setMessages(prev => [...prev, { role: 'model', text: response.reply }]);

            if (response.updatedStops) {
                console.log('Updating stops:', response.updatedStops);
                // Map back to RouteStop
                const updatedRouteStops: RouteStop[] = response.updatedStops.map(s => {
                    // Import Timestamp dynamically or use a helper if possible, 
                    // but since this is a client component, we can import from firebase/firestore
                    const { Timestamp } = require('firebase/firestore');
                    return {
                        spot_id: s.spot_id,
                        order: s.order,
                        type: s.type,
                        stop_name: s.notes,
                        stop_name_en: s.notes_en,
                        stop_name_zh: s.notes_zh,
                        stop_name_ko: s.notes_ko,
                        notes: s.details,
                        notes_en: s.notes_en,
                        notes_zh: s.notes_zh,
                        notes_ko: s.notes_ko,
                        arrival_time: s.arrival_time_iso ? Timestamp.fromDate(new Date(s.arrival_time_iso)) : undefined,
                        departure_time: s.departure_time_iso ? Timestamp.fromDate(new Date(s.departure_time_iso)) : undefined,
                        cost_estimate: s.cost_estimate,
                        cost_estimate_usd: s.cost_estimate_usd,
                        details: s.details,
                        booking_url: s.booking_url,
                        recommended_date: s.recommended_date,
                        time_zone: s.time_zone,
                        alternatives: s.alternatives
                    };
                });
                onPlanUpdate(updatedRouteStops);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', text: '申し訳ありません、エラーが発生しました。もう一度お試しください。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            >
                {isOpen ? (
                    <span className="text-xl">✕</span>
                ) : (
                    <span className="text-2xl">💬</span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-white font-bold">プラン調整チャット</h3>
                        <span className="text-xs text-green-400 flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                            AI Online
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white/10 text-gray-200 rounded-bl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 text-gray-200 p-3 rounded-2xl rounded-bl-none text-sm flex space-x-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="要望を入力..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-full transition w-10 h-10 flex items-center justify-center"
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
