'use client';

import { useState } from 'react';
import { TravelStyle } from '@/types/firestore';
import { updateUser } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

type Question = {
    id: number;
    text: string;
    options: {
        text: string;
        score: number;
    }[];
};

const questions: Question[] = [
    {
        id: 1,
        text: '旅行のスケジュールは？',
        options: [
            { text: '分刻みで詰め込む', score: 1 },
            { text: 'ある程度決める', score: 2 },
            { text: '現地で気分で決める', score: 3 },
        ],
    },
    {
        id: 2,
        text: '予算の使い方は？',
        options: [
            { text: 'とにかく安く済ませたい', score: 1 },
            { text: 'バランス重視', score: 2 },
            { text: '高くても良いものを', score: 3 },
        ],
    },
    {
        id: 3,
        text: '計画の立て方は？',
        options: [
            { text: '徹底的にリサーチ', score: 2 },
            { text: 'ざっくり決める', score: 3 },
            { text: '効率重視で最適化', score: 1 },
        ],
    },
    {
        id: 4,
        text: '食事のスタイルは？',
        options: [
            { text: '安くて美味しいB級グルメ', score: 1 },
            { text: '現地の人気店', score: 2 },
            { text: '高級レストランやコース', score: 3 },
        ],
    },
    {
        id: 5,
        text: '現地での行動は？',
        options: [
            { text: '観光名所を全制覇', score: 1 },
            { text: 'ゆったり散策', score: 3 },
            { text: '体験やアクティビティ重視', score: 2 },
        ],
    },
];

export default function TravelStyleDiagnosis() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [result, setResult] = useState<TravelStyle | null>(null);
    const [loading, setLoading] = useState(false);

    const { user, refreshFirestoreUser } = useAuth();

    const handleAnswer = async (score: number) => {
        const newScores = [...scores, score];
        setScores(newScores);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateResult(newScores);
        }
    };

    const calculateResult = async (finalScores: number[]) => {
        setLoading(true);
        const totalScore = finalScores.reduce((a, b) => a + b, 0);
        let style: TravelStyle = '快適計画';

        if (totalScore <= 8) {
            style = '爆速コスパ';
        } else if (totalScore >= 13) {
            style = '贅沢体験';
        }

        setResult(style);

        if (user) {
            try {
                await updateUser(user.uid, {
                    style_result: style,
                    updated_at: Timestamp.now(),
                });
                await refreshFirestoreUser();
                console.log('User style updated:', style);
            } catch (error) {
                console.error('Error saving user style:', error);
            }
        } else {
            console.log('User not logged in, style not saved to Firestore.');
        }
        setLoading(false);
    };

    if (result) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4">診断結果</h2>
                <p className="text-lg mb-2">あなたのトラベルスタイルは...</p>
                <div className="text-3xl font-bold text-blue-600 mb-6">{result}</div>
                <p className="text-gray-700 mb-6">
                    {result === '爆速コスパ' && '効率とコストパフォーマンスを最重視する賢い旅人タイプ。'}
                    {result === '快適計画' && 'バランスの取れた計画で失敗のない旅を楽しむタイプ。'}
                    {result === '贅沢体験' && '時間と予算を惜しまず、最高の体験を求める優雅な旅人タイプ。'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-300 transition"
                >
                    もう一度診断する
                </button>
            </div>
        );
    }

    const question = questions[currentQuestion];

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Question {currentQuestion + 1}</span>
                    <span>{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-6">{question.text}</h2>

            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(option.score)}
                        disabled={loading}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition duration-200"
                    >
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
