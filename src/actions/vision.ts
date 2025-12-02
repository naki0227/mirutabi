'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeImageForLocation(imageBase64: string): Promise<{ name: string; lat: number; lng: number; confidence: number } | null> {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set');
        return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
    Analyze this image and identify the specific location or landmark shown.
    If you can identify it with high confidence, return a JSON object with:
    - "name": The specific name of the place (e.g., "Tokyo Tower", "Kinkakuji").
    - "lat": The latitude.
    - "lng": The longitude.
    - "confidence": A number between 0 and 1 indicating your confidence.

    If you cannot identify a specific location (e.g., it's a generic selfie or food photo without context), return null.
    Do not include markdown formatting. Return only the raw JSON string.
    `;

    try {
        // Remove header if present (data:image/jpeg;base64,)
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg', // Assuming JPEG for simplicity, or detect from header
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanedText === 'null') return null;

        const data = JSON.parse(cleanedText);
        return data;
    } catch (error) {
        console.error('Error analyzing image:', error);
        return null;
    }
}

export async function analyzeImagesForTrip(imagesBase64: string[]): Promise<{ name: string; description: string }[]> {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set');
        return [];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const results = await Promise.all(imagesBase64.map(async (base64) => {
        const prompt = `
        Analyze this image for travel planning purposes.
        Identify the specific location/landmark if possible.
        If not a specific landmark, describe the "vibe" or type of place (e.g., "Cozy book cafe", "Sunset beach").
        
        Return a JSON object with:
        - "name": The specific name if known, otherwise a short title (e.g., "Unknown Cafe").
        - "description": A brief description of what is shown and why a traveler might save this photo.
        
        Do not include markdown formatting. Return only the raw JSON string.
        `;

        try {
            const base64Data = base64.split(',')[1] || base64;
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    },
                },
            ]);
            const response = await result.response;
            const text = response.text();
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error('Error analyzing one of the images:', e);
            return null;
        }
    }));

    return results.filter(r => r !== null) as { name: string; description: string }[];
}
