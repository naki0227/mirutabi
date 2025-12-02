'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratedStop } from './plan';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatResponse {
  updatedStops?: GeneratedStop[];
  reply: string;
}

export async function chatWithPlan(
  currentStops: GeneratedStop[],
  userMessage: string,
  history: { role: 'user' | 'model'; parts: string }[],
  language: string = 'ja'
): Promise<ChatResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('API Key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `
    You are an expert travel planner AI assistant.
    Current Date: ${today}.
    
    You are helping a user refine their travel itinerary.
    
    Current Itinerary (JSON):
    ${JSON.stringify(currentStops, null, 2)}
    
    User Request: "${userMessage}"
    
    INSTRUCTIONS:
    1. Analyze the user's request.
    2. If the user wants to modify the plan (e.g., "change hotel", "add lunch", "remove dinner", "shorten trip"), you MUST return the UPDATED JSON of the itinerary.
       - The JSON must strictly follow the same structure as the input.
       - Ensure time continuity if you add/remove/change items.
       - Recalculate costs if necessary.
       - **CRITICAL: When adding or changing a spot (restaurant, hotel, activity, transport), you MUST provide:**
         - **Specific NAME**: Do NOT use vague terms like "a nice cafe" or "cheap hotel". Search for a REAL place (e.g., "Starbucks Shibuya", "Hotel Sunroute Plaza").
         - **Exact PRICE estimate**: Do NOT use "around 1000 yen". Provide a concrete estimate based on the real place.
         - **URL**: Provide the official website or booking URL if possible.
         - **Transport Details**: If changing transport, provide specific train/bus names and boarding locations.
    3. If the user just asks a question, return ONLY a text reply.
    4. If you update the plan, also provide a brief text explanation of what you changed in the "reply" field.
    
    CRITICAL RULES:
    - The "reply" field MUST be in the language specified by the user: "${language}".
    - If the language is 'ja' or unspecified, default to Japanese.
    - The "reply" field must ONLY contain your answer. DO NOT repeat or echo the user's request.
    - Do not output "User Request: ..." or similar prefixes.
    - **IF YOU SAY YOU CHANGED THE PLAN IN THE REPLY, YOU MUST RETURN "updatedStops".**
    - If "updatedStops" is missing, the user will NOT see any changes.
    
    OUTPUT FORMAT:
    Return a JSON object with two fields:
    - "updatedStops": (Optional) The updated array of stops if the plan was modified. Omit if no changes.
    - "reply": A text response to the user explaining the change or answering the question.
    
    Example Output (Plan Change):
    {
      "updatedStops": [...],
      "reply": "ご希望通り、ホテルを安い場所に変更しました。"
    }
    
    Example Output (No Plan Change):
    {
      "reply": "合計費用は約15万円です。"
    }
    
    IMPORTANT:
    - Return ONLY the raw JSON string. Do not use markdown code blocks.
    - Maintain the integrity of the JSON structure.
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedResponse = JSON.parse(cleanedText);

    return parsedResponse;
  } catch (error) {
    console.error('Error in chatWithPlan:', error);
    throw new Error('Failed to process chat request');
  }
}
