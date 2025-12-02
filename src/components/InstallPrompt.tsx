'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as any).MSStream
        );

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isStandalone) return null;

    return (
        <>
            {/* Android / Desktop Install Button */}
            {deferredPrompt && (
                <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce-in">
                    <div className="relative">
                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 pr-12"
                        >
                            <span>📲</span> アプリをインストールして快適に使う
                        </button>
                        <button
                            onClick={() => setDeferredPrompt(null)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* iOS Instructions */}
            {isIOS && (
                <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 z-50 border-t border-gray-200 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <img src="/appIcon.png" alt="Icon" className="w-10 h-10 rounded-md" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 mb-1">ホーム画面に追加してアプリとして使う</p>
                            <p className="text-xs text-gray-600">
                                下のメニューの <span className="font-bold text-blue-600">共有ボタン</span> をタップして、
                                <br />
                                <span className="font-bold">「ホーム画面に追加」</span> を選択してください。
                            </p>
                        </div>
                        <button
                            onClick={() => setIsIOS(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
