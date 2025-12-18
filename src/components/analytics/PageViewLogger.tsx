'use client';

import { useEffect } from 'react';
import { sendLog } from '@/lib/logger';
import { usePathname } from 'next/navigation';

export const PageViewLogger = () => {
    const pathname = usePathname();

    useEffect(() => {
        sendLog('view_page', { path: pathname });
    }, [pathname]);

    return null;
};
