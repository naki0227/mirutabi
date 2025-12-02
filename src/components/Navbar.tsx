'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Map, Smartphone, Hotel, User } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'ホーム', path: '/' },
        { name: '診断', path: '/diagnosis' },
        { name: '計画', path: '/plan' },
        { name: '探索', path: '/explore' },
        { name: 'フィード', path: '/feed' },
        { name: 'リール', path: '/reels' },
        { name: 'ホテルマッチ', path: '/hotel-match' },
        { name: 'マイページ', path: '/mypage' },
    ];

    if (pathname === '/reels') return null;

    return (
        <>
            {/* Desktop Navbar */}
            <nav className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-lg justify-between items-center">
                <ul className="flex space-x-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white font-bold' : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="ml-4 border-l border-white/10 pl-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/mypage" className="flex items-center gap-2 hover:opacity-80 transition">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/20" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </Link>
                            <button
                                onClick={() => logout()}
                                className="text-xs text-gray-300 hover:text-white transition"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </nav>



            {/* Mobile Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
                <ul className="flex justify-around items-center h-16">
                    {navItems.filter(item => ['ホーム', '計画', 'フィード', 'ホテルマッチ', 'マイページ'].includes(item.name)).map((item) => {
                        const isActive = pathname === item.path;
                        // Icon mapping
                        let IconComponent = User;
                        if (item.name === 'ホーム') IconComponent = Home;
                        else if (item.name === '計画') IconComponent = Map;
                        else if (item.name === 'フィード') IconComponent = Smartphone;
                        else if (item.name === 'ホテルマッチ') IconComponent = Hotel;

                        return (
                            <li key={item.path} className="flex-1">
                                <Link
                                    href={item.path}
                                    className={`flex flex-col items-center justify-center h-full w-full ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    <IconComponent size={24} className="mb-1" />
                                    <span className="text-[10px] font-bold">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
}
