export type LogEventType = 'view_page' | 'click_button' | 'search' | 'conversion';

interface LogEntry {
    user_id?: string;
    event_type: LogEventType;
    path: string;
    meta?: Record<string, string>;
}

const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:8080';

export const sendLog = async (event: LogEventType, meta?: Record<string, string>) => {
    try {
        // Basic user identification (simplified)
        // In a real app, you might get this from your Auth Context or LocalStorage
        const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') || 'guest' : 'server';
        const path = typeof window !== 'undefined' ? window.location.pathname : '/';

        const payload: LogEntry = {
            user_id: userId,
            event_type: event,
            path,
            meta,
        };

        // Fire and forget - don't await the result to block UI
        fetch(`${ANALYTICS_ENDPOINT}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).catch((err) => {
            // Silently fail or log to console in debug mode
            if (process.env.NODE_ENV === 'development') {
                console.error('Analytics failed:', err);
            }
        });
    } catch (error) {
        console.error('Failed to construct log:', error);
    }
};
