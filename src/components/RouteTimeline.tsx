'use client';

import { useState, useEffect } from 'react';
import { RouteStop } from '@/types/firestore';
import { generateHotelLink, generateTransportLink, generateRestaurantLink, generateActivityLink, generateFlightLink, generateBusLink, generateTrainLink } from '@/utils/booking';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plane, Train, Bus, Utensils, Hotel, FerrisWheel, MapPin, ExternalLink, Star } from 'lucide-react';

interface RouteTimelineProps {
    stops: RouteStop[];
    isMultilingual: boolean;
    group?: { adults: number; children: number; infants: number };
}

type Language = 'ja' | 'en' | 'zh' | 'ko';

export default function RouteTimeline({ stops: initialStops, group }: RouteTimelineProps) {
    const [activeLang, setActiveLang] = useState<Language>('ja');
    const [stops, setStops] = useState<RouteStop[]>(initialStops);

    useEffect(() => {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('en')) setActiveLang('en');
        else if (browserLang.startsWith('zh')) setActiveLang('zh');
        else if (browserLang.startsWith('ko')) setActiveLang('ko');
        else setActiveLang('ja'); // Default to Japanese
    }, []);

    useEffect(() => {
        setStops(initialStops);
    }, [initialStops]);

    if (stops.length === 0) return null;

    const [selectedAlternatives, setSelectedAlternatives] = useState<{ [key: number]: number }>({});

    const handleAlternativeSelect = (stopIndex: number, altIndex: number | undefined) => {
        setSelectedAlternatives(prev => {
            const newSelected = { ...prev };
            if (altIndex === undefined) {
                delete newSelected[stopIndex];
            } else {
                newSelected[stopIndex] = altIndex;
            }
            return newSelected;
        });
    };

    const getNote = (stop: RouteStop, lang: Language) => {
        switch (lang) {
            case 'en': return stop.notes_en || stop.notes;
            case 'zh': return stop.notes_zh || stop.notes;
            case 'ko': return stop.notes_ko || stop.notes;
            default: return stop.notes;
        }
    };

    const handleSwapAlternative = (stopIndex: number, alternative: any) => {
        const newStops = [...stops];
        const currentStop = newStops[stopIndex];

        // Create a new stop object with alternative details
        // Preserve original alternatives list but remove the selected one and add the current one back
        const currentAsAlternative = {
            name: currentStop.notes || 'Unknown',
            cost_estimate: currentStop.cost_estimate || 0,
            cost_estimate_usd: currentStop.cost_estimate_usd,
            details: currentStop.details,
            booking_url: currentStop.booking_url,
            type: currentStop.type || 'other'
        };

        const newAlternatives = currentStop.alternatives
            ? currentStop.alternatives.filter(a => a.name !== alternative.name)
            : [];
        newAlternatives.push(currentAsAlternative);

        newStops[stopIndex] = {
            ...currentStop,
            notes: alternative.name,
            cost_estimate: alternative.cost_estimate,
            cost_estimate_usd: alternative.cost_estimate_usd,
            details: alternative.details,
            booking_url: alternative.booking_url,
            type: alternative.type as any,
            alternatives: newAlternatives
        };

        setStops(newStops);
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'flight': return '✈️';
            case 'train': return '🚄';
            case 'bus': return '🚌';
            case 'meal': return '🍽️';
            case 'accommodation': return '🏨';
            case 'activity': return '🎡';
            default: return '📍';
        }
    };

    const getTypeLabel = (type?: string) => {
        switch (type) {
            case 'flight': return 'Flight';
            case 'train': return 'Train';
            case 'bus': return 'Bus';
            case 'meal': return 'Meal';
            case 'accommodation': return 'Hotel';
            case 'activity': return 'Activity';
            default: return 'Spot';
        }
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'flight': return 'bg-blue-400';
            case 'train': return 'bg-blue-500';
            case 'bus': return 'bg-blue-600';
            case 'meal': return 'bg-orange-400';
            case 'accommodation': return 'bg-purple-500';
            case 'activity': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    const getBilingualText = (ja?: string, en?: string, zh?: string, ko?: string) => {
        switch (activeLang) {
            case 'en': return en || ja;
            case 'zh': return zh || ja;
            case 'ko': return ko || ja;
            default: return ja;
        }
    };

    const formatDate = (date?: any, timeZone?: string) => {
        if (!date) return '--:--';
        // Handle Firestore Timestamp
        const d = date.toDate ? date.toDate() : new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${timeZone || '現地時間'})`;
    };

    const hasTranslations = stops.some(stop => stop.notes_en || stop.notes_zh || stop.notes_ko);

    // Calculate total cost considering selected alternatives
    const currentStops = stops.map((stop, index) => {
        const altIndex = selectedAlternatives[index];
        if (altIndex !== undefined && stop.alternatives && stop.alternatives[altIndex]) {
            return {
                ...stop,
                cost_estimate: stop.alternatives[altIndex].cost_estimate,
                cost_estimate_usd: stop.alternatives[altIndex].cost_estimate_usd
            };
        }
        return stop;
    });

    const totalCost = currentStops.reduce((sum, stop) => sum + (stop.cost_estimate || 0), 0);
    const totalCostUsd = currentStops.reduce((sum, stop) => sum + (stop.cost_estimate_usd || 0), 0);
    const recommendedDate = stops.find(stop => stop.recommended_date)?.recommended_date;

    // Calculate duration
    let durationString = '';
    if (stops.length > 0) {
        const sortedStops = [...stops].sort((a, b) => (a.arrival_time?.toMillis() || 0) - (b.arrival_time?.toMillis() || 0));
        const firstStop = sortedStops[0];
        const lastStop = sortedStops[sortedStops.length - 1];

        if (firstStop.arrival_time && lastStop.departure_time) {
            const start = firstStop.arrival_time.toDate ? firstStop.arrival_time.toDate() : new Date(firstStop.arrival_time as any);
            const end = lastStop.departure_time.toDate ? lastStop.departure_time.toDate() : new Date(lastStop.departure_time as any);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const nights = Math.max(0, diffDays - 1);
            durationString = `${nights}泊${diffDays}日`;
        }
    }

    const getSmartLink = (stop: any) => {
        // Force use of generated links to avoid 404s from AI-hallucinated URLs
        // if (stop.booking_url) return stop.booking_url;

        // Extract dates
        const date = stop.arrival_time ? (stop.arrival_time.toDate ? stop.arrival_time.toDate() : new Date(stop.arrival_time)).toISOString().split('T')[0] : undefined;
        const nextDate = stop.arrival_time ? new Date((stop.arrival_time.toDate ? stop.arrival_time.toDate() : new Date(stop.arrival_time)).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined;

        if (stop.type === 'accommodation') {
            return generateHotelLink(stop.stop_name || stop.name, date, nextDate, group?.adults || 2, group?.children || 0);
        } else if (stop.type === 'flight' && stop.stop_name && stop.stop_name.includes('→')) {
            const [from, to] = stop.stop_name.split('→').map((s: string) => s.trim());
            return generateFlightLink(from, to, date);
        } else if (stop.type === 'bus' && stop.stop_name && stop.stop_name.includes('→')) {
            const [from, to] = stop.stop_name.split('→').map((s: string) => s.trim());
            return generateBusLink(from, to, date);
        } else if (stop.type === 'train' && stop.stop_name && stop.stop_name.includes('→')) {
            const [from, to] = stop.stop_name.split('→').map((s: string) => s.trim());
            return generateTrainLink(from, to, date);
        } else if (stop.type === 'meal' || stop.type === 'food') {
            return generateRestaurantLink(stop.stop_name || stop.name);
        } else {
            return generateActivityLink(stop.stop_name || stop.name);
        }
    };

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStops((items) => {
                const oldIndex = items.findIndex((item) => item.spot_id === active.id);
                const newIndex = items.findIndex((item) => item.spot_id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 pb-20">
            {recommendedDate && (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg backdrop-blur-sm text-center">
                    <span className="text-blue-200 font-medium">おすすめの日程: </span>
                    <span className="text-white font-bold text-lg ml-2">{recommendedDate}</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-100">提案プラン</h3>
                    {durationString && (
                        <span className="text-sm text-blue-300 font-medium">{durationString}</span>
                    )}
                </div>

                {hasTranslations && (
                    <div className="flex space-x-2 bg-white/10 p-1 rounded-lg backdrop-blur-sm">
                        {(['ja', 'en', 'zh', 'ko'] as Language[]).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setActiveLang(lang)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition ${activeLang === lang
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-200 hover:text-white'
                                    }`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stops.map(s => s.spot_id)} strategy={verticalListSortingStrategy}>
                    <div className="relative border-l-2 border-blue-200 ml-4 space-y-8">
                        {stops.map((stop, index) => (
                            <SortableItem
                                key={stop.spot_id}
                                stop={stop}
                                index={index}
                                activeLang={activeLang}
                                selectedAlternative={selectedAlternatives[index]}
                                onAlternativeSelect={(altIndex: number) => handleAlternativeSelect(index, altIndex)}
                                getBilingualText={getBilingualText}
                                formatDate={formatDate}
                                getTypeColor={getTypeColor}
                                getTypeLabel={getTypeLabel}
                                getSmartLink={getSmartLink}
                                stops={stops}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 p-4 z-40">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <span className="text-gray-200 font-medium">合計概算費用</span>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-green-400">¥{totalCost.toLocaleString()}</span>
                        {totalCostUsd > 0 && (
                            <span className="block text-sm text-gray-300">(${totalCostUsd.toLocaleString()})</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SortableItem({
    stop,
    index,
    activeLang,
    selectedAlternative,
    onAlternativeSelect,
    getBilingualText,
    formatDate,
    getTypeColor,
    getTypeLabel,
    getSmartLink,
    stops
}: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: stop.spot_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isAlternativeSelected = selectedAlternative !== undefined;
    const currentStop = isAlternativeSelected && stop.alternatives && stop.alternatives[selectedAlternative]
        ? {
            ...stop,
            ...stop.alternatives[selectedAlternative],
            type: (stop.alternatives[selectedAlternative].type || stop.type) as any,
            stop_name: stop.alternatives[selectedAlternative].name,
            notes: stop.alternatives[selectedAlternative].details,
            cost_estimate: stop.alternatives[selectedAlternative].cost_estimate,
            cost_estimate_usd: stop.alternatives[selectedAlternative].cost_estimate_usd,
            booking_url: stop.alternatives[selectedAlternative].booking_url,
        }
        : stop;

    // Calculate duration from previous stop
    let travelTime = '';
    if (index > 0) {
        const prev = stops[index - 1];
        // Note: We can't easily access selectedAlternatives for the previous item here without passing it down
        // For simplicity in DnD view, we might skip precise travel time calculation or assume default
        // Or better, pass the full selectedAlternatives map to SortableItem
    }

    const smartLink = getSmartLink(currentStop);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative pl-6 touch-none">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${getTypeColor(currentStop.type)} border-white shadow`}></div>

            {/* Content Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className={`text-xs font-bold px-2 py-1 rounded text-white mb-2 inline-flex items-center gap-1 ${getTypeColor(currentStop.type)}`}>
                            {(() => {
                                switch (currentStop.type) {
                                    case 'flight': return <Plane size={12} />;
                                    case 'train': return <Train size={12} />;
                                    case 'bus': return <Bus size={12} />;
                                    case 'meal': return <Utensils size={12} />;
                                    case 'accommodation': return <Hotel size={12} />;
                                    case 'activity': return <FerrisWheel size={12} />;
                                    default: return <MapPin size={12} />;
                                }
                            })()}
                            {getTypeLabel(currentStop.type)}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">
                            {getBilingualText(currentStop.stop_name, currentStop.stop_name_en, currentStop.stop_name_zh, currentStop.stop_name_ko) || 'スポット名未定'}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                            {formatDate(currentStop.arrival_time)}
                        </div>
                        {currentStop.departure_time && (
                            <div className="text-xs text-gray-500">
                                ~ {formatDate(currentStop.departure_time).split(' ')[1]}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">
                    {getBilingualText(currentStop.notes, currentStop.notes_en, currentStop.notes_zh, currentStop.notes_ko)}
                </p>

                {/* Google Places Data */}
                {currentStop.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden h-40 w-full">
                        <img src={currentStop.image_url} alt={currentStop.stop_name} className="w-full h-full object-cover" />
                    </div>
                )}

                {currentStop.rating && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold text-gray-700">{currentStop.rating}</span>
                        {currentStop.address && (
                            <span className="text-xs text-gray-500 ml-2 truncate max-w-[200px]">{currentStop.address}</span>
                        )}
                    </div>
                )}

                {/* Tags & Metadata */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {currentStop.cost_estimate && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            💰 ¥{currentStop.cost_estimate.toLocaleString()}
                            {currentStop.cost_estimate_usd && ` ($${currentStop.cost_estimate_usd.toLocaleString()})`}
                        </span>
                    )}
                    {currentStop.recommended_date && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            📅 推奨: {currentStop.recommended_date}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100" onPointerDown={(e) => e.stopPropagation()}>
                    {smartLink ? (
                        <a
                            href={smartLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                            <span>予約・詳細を見る</span>
                            <ExternalLink size={14} className="ml-1" />
                        </a>
                    ) : (
                        <span className="text-sm text-gray-600">予約リンクなし</span>
                    )}
                    {currentStop.type === 'accommodation' && (
                        <span className="text-xs text-gray-500">
                            ※空室状況はリンク先で確認
                        </span>
                    )}
                </div>

                {/* Alternatives */}
                {stop.alternatives && stop.alternatives.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-dashed border-gray-200" onPointerDown={(e) => e.stopPropagation()}>
                        <p className="text-xs text-gray-600 mb-2">他の選択肢:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onAlternativeSelect(undefined)}
                                className={`text-xs px-2 py-1 rounded border ${selectedAlternative === undefined ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                プランA ({getBilingualText(stop.stop_name, stop.stop_name_en, stop.stop_name_zh, stop.stop_name_ko) || 'オリジナル'})
                            </button>
                            {stop.alternatives.map((alt: any, altIndex: number) => (
                                <button
                                    key={altIndex}
                                    onClick={() => onAlternativeSelect(altIndex)}
                                    className={`text-xs px-2 py-1 rounded border ${selectedAlternative === altIndex ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                >
                                    プラン{String.fromCharCode(66 + altIndex)}: {alt.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
