'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Hotel } from '@/types/hotel';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeHotelPreferences(likedHotels: Hotel[]) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set');
        return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const likedNames = likedHotels.map(h => `${h.name} (${h.tags.join(', ')})`).join('\n');

    const prompt = `
    Based on the following hotels that the user "Liked", analyze their travel personality and recommend 3 similar hotels in Japan.
    
    Liked Hotels:
    ${likedNames}
    
    Return a JSON object with the following fields. Ensure ALL content is in Japanese:
    - "personality": A short, catchy title for their travel style (e.g., "都会派ミニマリスト", "自然派ラグジュアリー").
    - "description": A 1-2 sentence explanation of their taste in Japanese.
    - "recommendations": An array of 3 hotels in Japan. Each hotel should have:
        - "name": Hotel Name (Japanese)
        - "location": City/Area (Japanese)
        - "reason": Why it matches their taste (Japanese)
        - "tags": Array of 3 keywords (Japanese)
    
    Do not include markdown formatting. Return only the raw JSON string.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Error analyzing preferences:', error);
        return null;
    }
}
