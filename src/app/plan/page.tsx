'use client';

import { useState, useRef } from 'react';
import PlanInput from '@/components/PlanInput';
import RouteTimeline from '@/components/RouteTimeline';
import PlanChat from '@/components/PlanChat';
import { generatePlan } from '@/actions/plan';
import { RouteStop } from '@/types/firestore';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { saveRoute } from '@/lib/db';
import { useReactToPrint } from 'react-to-print';

export default function PlanPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentGroup, setCurrentGroup] = useState<{ adults: number; children: number; infants: number } | undefined>(undefined);
    const [currentIsMultilingual, setCurrentIsMultilingual] = useState(false);
    const { firestoreUser } = useAuth();

    const handlePlanSubmit = async (
        input: string,
        isMultilingual: boolean,
        transportModes: string[],
        group: { adults: number; children: number; infants: number },
        budget: { amount: string; type: 'total' | 'per_person' }
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            setCurrentGroup(group);
            setCurrentIsMultilingual(isMultilingual);
            const language = navigator.language || 'ja';
            const userProfile = firestoreUser ? {
                style: firestoreUser.style_result,
                gender: firestoreUser.gender,
                age: firestoreUser.age,
                health_notes: firestoreUser.health_notes,
                companions: firestoreUser.companions,
                tags: firestoreUser.tags
            } : undefined;

            const generatedStops = await generatePlan(input, isMultilingual, language, transportModes, group, budget, userProfile);

            // Convert GeneratedStop to RouteStop (ISO strings to Timestamps)
            const routeStops: RouteStop[] = generatedStops.map(stop => ({
                spot_id: stop.spot_id,
                order: stop.order,
                type: stop.type,
                stop_name: stop.notes, // Map notes to stop_name as per prompt structure
                stop_name_en: stop.notes_en,
                stop_name_zh: stop.notes_zh,
                stop_name_ko: stop.notes_ko,
                notes: stop.details, // Map details to notes (description)
                arrival_time: stop.arrival_time_iso ? Timestamp.fromDate(new Date(stop.arrival_time_iso)) : undefined,
                departure_time: stop.departure_time_iso ? Timestamp.fromDate(new Date(stop.departure_time_iso)) : undefined,
                cost_estimate: stop.cost_estimate,
                cost_estimate_usd: stop.cost_estimate_usd,
                details: stop.details,
                booking_url: stop.booking_url,
                recommended_date: stop.recommended_date,
                time_zone: stop.time_zone,
                image_url: stop.image_url,
                rating: stop.rating,
                address: stop.address,
                alternatives: stop.alternatives
            }));

            // Sort stops by arrival_time or order
            routeStops.sort((a, b) => {
                if (a.arrival_time && b.arrival_time) {
                    return a.arrival_time.toMillis() - b.arrival_time.toMillis();
                }
                return a.order - b.order;
            });

            setStops(routeStops);
        } catch (err) {
            console.error(err);
            setError('プランの作成に失敗しました。APIキーが設定されているか確認してください。');
        } finally {
            setIsLoading(false);
        }
    };

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: 'Travel Plan',
    });

    const handleSave = async () => {
        if (!firestoreUser || stops.length === 0) return;
        try {
            await saveRoute({
                creator_id: firestoreUser.user_id,
                title: `My Trip Plan ${new Date().toLocaleDateString()}`,
                is_public: false,
                reused_count: 0,
                stops: stops,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now(),
                likes_count: 0
            });
            alert('プランを保存しました！マイページで確認できます。');
        } catch (e) {
            console.error('Error saving plan:', e);
            console.error('Failed stops data:', stops);
            console.error('User ID:', firestoreUser.user_id);
            alert(`保存に失敗しました: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-3xl mx-auto text-center mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-lg">AIトラベルプランナー</h1>
                <p className="mt-4 text-lg text-gray-200">
                    行きたい場所、予算、スタイルを教えてください。<br />
                    AIがあなたにぴったりの旅行プランを提案します。
                </p>
            </div>

            <PlanInput onSubmit={handlePlanSubmit} isLoading={isLoading} />

            {error && (
                <div className="max-w-2xl mx-auto mt-4 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg backdrop-blur-sm">
                    {error}
                </div>
            )}

            {stops.length > 0 && (
                <div className="mt-8">
                    <div className="flex justify-end gap-4 mb-4 max-w-2xl mx-auto">
                        {firestoreUser && (
                            <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
                            >
                                <span>💾</span> 保存する
                            </button>
                        )}
                        <button
                            onClick={() => handlePrint()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
                        >
                            <span>🖨️</span> PDF出力
                        </button>
                    </div>
                    <div ref={componentRef} className="bg-white/5 p-4 rounded-xl">
                        <div className="print:text-black print:bg-white">
                            <RouteTimeline stops={stops} isMultilingual={currentIsMultilingual} group={currentGroup} />
                        </div>
                    </div>
                </div>
            )}

            {stops.length > 0 && (
                <PlanChat stops={stops} onPlanUpdate={setStops} />
            )}
        </div>
    );
}
