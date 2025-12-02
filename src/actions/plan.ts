'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeneratedStop {
  spot_id: string;
  order: number;
  type: 'flight' | 'train' | 'bus' | 'meal' | 'activity' | 'accommodation' | 'other';
  notes: string;
  notes_en?: string;
  notes_zh?: string;
  notes_ko?: string;
  arrival_time_iso?: string;
  departure_time_iso?: string;
  cost_estimate?: number;
  cost_estimate_usd?: number;
  details?: string; // e.g., "JL123", "Shinkansen Hikari"
  booking_url?: string;
  recommended_date?: string;
  time_zone?: string;
  image_url?: string;
  rating?: number;
  address?: string;
  alternatives?: {
    name: string;
    cost_estimate: number;
    cost_estimate_usd?: number;
    details?: string;
    booking_url?: string;
    type: string;
  }[];
}

import { searchPlace, getPlaceDetails } from '@/lib/google-places';

export async function generatePlan(
  userInput: string,
  isMultilingual: boolean = false,
  language: string = 'ja',
  transportModes: string[] = ['flight'],
  group: { adults: number; children: number; infants: number } = { adults: 1, children: 0, infants: 0 },
  budget: { amount: string; type: 'total' | 'per_person' } = { amount: '', type: 'per_person' },
  userProfile?: {
    style?: string;
    gender?: string;
    age?: number;
    health_notes?: string;
    companions?: any[];
    tags?: string[];
  }
): Promise<GeneratedStop[]> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    throw new Error('API Key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const today = new Date().toISOString().split('T')[0];

  let prompt = `
    You are an expert travel planner AI.
    Current Date: ${today}.
    Create a highly detailed travel itinerary based on the user's request: "${userInput}".
    
    IMPORTANT:
    1. Generate the plan in the user's language: "${language}".
       - If language is 'ja', use Japanese. If 'en', use English.
    2. Plan for a group of: ${group.adults} Adults, ${group.children} Children (Elementary), ${group.infants} Infants.
       - Budget limit is: ${budget.amount ? budget.amount + ' JPY' : 'Not specified'} (${budget.type === 'total' ? 'Total for whole group' : 'Per Person'}).
       - Calculate costs considering age groups (e.g., child fares, infant free/reduced).
       - Suggest accommodation suitable for this group composition (e.g., family room, multiple rooms).
       - Output MUST include 'Total Cost' and 'Cost Per Person' in the summary or details of the final plan.
    
    3. **User Profile & Preferences**:
       - **Travel Style**: ${userProfile?.style ? `User prefers '${userProfile.style}' style. Prioritize [Comfort/Price/Experience] accordingly.` : 'No specific style preference.'}
       - **Health/Considerations**: ${userProfile?.health_notes ? `Consider health notes: '${userProfile.health_notes}'. Adjust pace and accessibility (e.g., less walking, elevators).` : 'No specific health notes.'}
       - **Companions**: ${userProfile?.companions && userProfile.companions.length > 0 ? `Companions info: ${JSON.stringify(userProfile.companions)}. Consider their needs (e.g., age, health).` : 'No registered companions info.'}
       - **User Info**: ${userProfile?.age ? `User Age: ${userProfile.age}` : ''} ${userProfile?.gender ? `Gender: ${userProfile.gender}` : ''}.
       - **Interest Tags**: ${userProfile?.tags && userProfile.tags.length > 0 ? userProfile.tags.join(', ') : 'No specific interest tags.'}.
       
       **COMPASS TRIP INSTRUCTION (CRITICAL)**:
       - If the user request starts with "Compass Trip:", it means the user wants to go in a specific **Direction** for a specific **Time/Distance** from a **Start Point**.
       - **Step 1: Identify Destination**:
         - Analyze the request: "From [Start] go [Direction] for approx [Time/Distance]".
         - Using your geographical knowledge, identify a suitable travel destination that matches these criteria.
         - Example: "From Tokyo go West for 2 hours" -> Suggest "Hakone", "Atami", or "Kofu".
         - Example: "From Osaka go South for 3 hours" -> Suggest "Shirahama" or "Koyasan".
         - If a "Theme" is provided (e.g., "Onsen", "Nature"), prioritize destinations known for that theme.
       - **Step 2: Plan the Trip**:
         - Once the destination is decided, create a full itinerary for that destination as usual.
          - **Explicitly mention** the chosen destination in the first item's 'notes' or 'details' (e.g., "Destination chosen: Hakone (West of Tokyo, approx 1.5h)").

       **DART TRIP INSTRUCTION (CRITICAL)**:
       - If the user request starts with "Dart Trip:", it means the user wants a **Random Destination** within a specific **Range**.
       - **Step 1: Select Destination**:
         - Analyze the range: "Randomly select a destination in [Range]".
         - Randomly pick a popular or interesting travel destination within that range.
         - Example: "Range: Asia" -> Randomly pick "Bangkok", "Seoul", "Taipei", or "Bali".
         - Example: "Range: Nationwide" -> Randomly pick "Hokkaido", "Okinawa", "Kyoto", or "Kanazawa".
       - **Step 2: Plan the Trip**:
         - Identify the **Start Point** from "From [Start Location]".
         - Create a full itinerary for the chosen destination, **starting from the Start Point**.
          - **Explicitly mention** the chosen destination and that it was randomly selected in the first item's 'notes' (e.g., "🎯 Dart Trip Destination: Sapporo!").

       **PHOTO TRIP INSTRUCTION (CRITICAL)**:
       - If the user request starts with "Photo Trip:", it contains a list of "Must-Visit Spots" identified from photos.
       - **MANDATORY**: You MUST include ALL the listed spots in the itinerary.
       - Optimize the route to visit these spots efficiently.
       - If the spots are far apart, suggest a logical order or splitting them across days.

       **CONCIERGE INSTRUCTION (CRITICAL)**:
       - If the user request starts with "Concierge Trip:", it contains personal data (Health, SNS, Weather).
       - **Health**: If "Stamina" is low or steps are low, avoid steep hills/long walks. Suggest taxis/buses.
       - **SNS**: Prioritize spots matching "Music" (e.g., Jazz bar) and "Food" (e.g., Ramen shop) preferences.
       - **Weather**: If "Rainy", prioritize indoor activities (museums, shopping malls, covered arcades).
       - **Explicitly mention** how you personalized the plan in the \`notes\` (e.g., "Chosen indoor spot due to rain forecast", "Selected Jazz bar based on your music taste").

       **CROWD-SAFE INSTRUCTION (CRITICAL)**:
       - If the user request includes "[Avoid Crowds]", you MUST prioritize avoiding congestion.
       - **Strategy 1: Hidden Gems**: Prioritize "穴場" (anaba) spots that are less crowded but equally attractive.
       - **Strategy 2: Time Shifting**: Schedule popular spots for early morning (e.g., 8:00 AM) or late evening.
       - **Strategy 3: Alternatives**: Instead of the most famous (and crowded) spot, suggest a similar but quieter alternative (e.g., instead of Kiyomizu-dera, suggest a smaller temple nearby).
       - Mark these choices in \`notes\` as "**Crowd-Safe Choice**".

       **TAG INSTRUCTION**:
       - **HEAVILY prioritize** spots and activities that match the User Interest Tags.
       - If "Onsen" is selected, you **MUST** include a hot spring visit (day trip or overnight).
       - If "Museum" is selected, include a famous or unique museum.
       - If "Gourmet" or specific food tags (e.g., "Ramen") are selected, prioritize highly-rated spots for those foods.
       - Mark these items in \`notes\` as "**Matches Tag: [Tag Name]**".
       
       **TREND INSTRUCTION**:
       - Analyze the User Demographics (Age, Gender) and Travel Style.
       - Identify currently **TRENDING** spots, foods, or activities in the destination that specifically appeal to this demographic (e.g., "Instagrammable cafes" for young women, "Retro Izakaya" for middle-aged men, "Glamping" for families).
       - **MANDATORY**: Incorporate at least one "Trending" item into the plan.
       - Mark this item in the \`notes\` field as "**Trending for [Demographic]**" (e.g., "Trending for 20s Female").

       **RELATIONSHIP INSTRUCTION**:
       - Analyze the **Relationship** with companions (based on 'companions' info).
       - Adjust the **Vibe and Pace** of the plan accordingly:
         - **Partner**: Prioritize romantic spots, special dinners, night views, and a relaxed but special atmosphere.
         - **Mother/Daughter**: Prioritize relaxing spots, shopping, nice cafes/tea houses. Ensure not too much walking if age is a factor.
         - **Friends**: Prioritize fun, trendy spots, photo opportunities, and active experiences.
         - **Family with Kids**: Prioritize kid-friendly facilities, parks, and a flexible schedule with breaks.
         - **Solo**: Prioritize personal interests, solo-friendly dining, and deep dives into specific topics.

    4. Consider the following transport options: ${transportModes.join(', ')}.
       - If 'shinkansen' is selected and viable, prioritize it for domestic long-distance.
       - If 'bus' is selected and viable (e.g., night bus), consider it as a budget option.
    5. If dates are not specified, recommend the cheapest dates in the near future (e.g., next 3 months from ${today}).
    6. Provide cost estimates in both JPY and USD (assume 1 USD = 150 JPY if unsure).
    7. STRICTLY ensure time continuity. 
       - CRITICAL: The first activity at the destination MUST start AFTER the arrival time of the inbound flight/train/bus.
       - Ensure that (Departure Time of Previous Stop) + (Travel Time) <= (Arrival Time of Current Stop).
       - Double check all timestamps to ensure strictly increasing order.
    8. For Flights/Trains/Buses: 
       - MUST provide real flight number (e.g., NH106), train name (e.g., Nozomi 1), or bus line (e.g., Willer Express).
       - **Cheapest Option**: Explicitly search for/estimate the lowest price for the chosen mode.
       - **Specific Locations**: MUST specify boarding and drop-off locations (e.g., "Tokyo Station (Yaesu South Exit)", "Busta Shinjuku").
       - If budget is insufficient, IGNORE budget for the transport and suggest the cheapest option with a warning note in 'details'.
    9. For Hotels: MUST provide specific hotel name (e.g., 'Hotel Sunroute Plaza') and URL.
       - MUST specify if cost is 'Total' or 'Per Night' in 'details' (e.g., 'Total for 3 nights', 'Per night').
       - Ensure 'notes' explicitly says 'Accommodation: [Hotel Name]' or similar to clarify it's time spent at the hotel.
    10. For Meals/Hotels: Provide 2-3 alternatives in an 'alternatives' array.
    11. MUST include at least one restaurant/meal recommendation per day.
    12. Include the round trip from the departure city.
    13. MUST provide the time zone abbreviation (e.g., "JST", "PST", "CET") for each location in 'time_zone' field.
    14. **REALISM CHECKS (CRITICAL)**:
        - **Transport Logic**: Do NOT suggest night buses or long-distance travel immediately after checking into a hotel or in the middle of a stay in one city.
        - **Flight Existence**: Verify that suggested flight routes actually exist between the specified cities. If no direct flight exists, suggest a connecting flight or alternative transport (train/bus).
        - **Geographical Consistency**: Ensure consecutive activities are geographically close or reachable within the allocated travel time.
        - **Hotel Logic**: Respect hotel check-in (usually 15:00) and check-out (usually 10:00-11:00) times. Do not schedule travel that conflicts with these unless checking out.
        - **Hub & Spoke Transport**: If a direct long-distance route (e.g., Night Bus, Flight) is NOT available from the starting point (e.g., a small local station), explicitly plan the transit to a major hub first.
          - Example: Instead of "Bus: Local Station -> Destination", output "Train: Local Station -> Major Hub (e.g., Osaka/Tokyo)", THEN "Bus: Major Hub -> Destination".
          - Do NOT invent direct routes that don't exist.
    
    Return the response as a JSON array of objects.
    The JSON should strictly follow this structure:
    [
      {
        "spot_id": "unique_id_1",
        "order": 1,
        "type": "flight" | "train" | "bus" | "meal" | "activity" | "accommodation" | "other",
        "notes": "Accommodation: Hotel Name (in Japanese)",
        "details": "Airline/Train Name/Restaurant Type. Cost: Total for 3 nights.",
        "arrival_time_iso": "YYYY-MM-DDTHH:mm:ss",
        "departure_time_iso": "YYYY-MM-DDTHH:mm:ss",
        "time_zone": "JST",
        "cost_estimate": 1000, (JPY)
        "cost_estimate_usd": 7, (USD)
        "recommended_date": "YYYY-MM-DD", (Only for the first item if suggesting a date)
        "alternatives": [
          {
            "name": "Alternative Name",
            "cost_estimate": 1200,
            "cost_estimate_usd": 8,
            "details": "Details",
            "booking_url": "URL",
            "type": "meal"
          }
        ]
      }
    ]
  `;

  if (isMultilingual) {
    prompt = `
    You are an expert travel planner AI.
    Current Date: ${today}.
    Create a highly detailed travel itinerary based on the user's request: "${userInput}".
    
    IMPORTANT:
    1. If dates are not specified, recommend the cheapest dates in the near future (from ${today}).
    2. Provide cost estimates in both JPY and USD.
    3. STRICTLY ensure time continuity.
       - CRITICAL: First activity MUST start AFTER flight arrival.
       - Ensure (Prev Departure) + (Travel) <= (Curr Arrival).
    4. For Flights: MUST provide real flight number and airline.
       - If budget is insufficient, suggest cheapest option with warning.
    5. For Hotels: MUST provide specific hotel name and URL.
       - MUST specify if cost is 'Total' or 'Per Night' in 'details'.
       - Ensure 'notes' explicitly says 'Accommodation: [Hotel Name]'.
    6. For Meals/Hotels: Provide 2-3 alternatives.
    7. MUST include at least one restaurant/meal recommendation per day.
    8. MUST provide the time zone abbreviation (e.g., "JST", "PST") for each location.
    9. **REALISM CHECKS (CRITICAL)**:
       - **Transport Logic**: Do NOT suggest night buses or long-distance travel immediately after checking into a hotel.
       - **Flight Existence**: Verify that suggested flight routes actually exist.
       - **Geographical Consistency**: Ensure consecutive activities are geographically close.
       - **Hotel Logic**: Respect hotel check-in/out times.
       - **Hub & Spoke Transport**: If direct route unavailable, plan transit to major hub first. Do NOT invent direct routes.
    
    Return the response as a JSON array of objects.
    The JSON should strictly follow this structure:
    [
      {
        "spot_id": "unique_id_1",
        "order": 1,
        "type": "flight" | "train" | "bus" | "meal" | "activity" | "accommodation" | "other",
        "notes": "Accommodation: Hotel Name (in Japanese)",
        "notes_en": "Name (English)",
        "notes_zh": "Name (Simplified Chinese)",
        "notes_ko": "Name (Korean)",
        "details": "Airline/Train Name/Restaurant Type",
        "arrival_time_iso": "YYYY-MM-DDTHH:mm:ss",
        "departure_time_iso": "YYYY-MM-DDTHH:mm:ss",
        "time_zone": "JST",
        "cost_estimate": 1000, (JPY)
        "cost_estimate_usd": 7, (USD)
        "recommended_date": "YYYY-MM-DD", (Only for the first item if suggesting a date)
        "alternatives": [
          {
            "name": "Alternative Name",
            "cost_estimate": 1200,
            "cost_estimate_usd": 8,
            "details": "Details",
            "booking_url": "URL",
            "type": "meal"
          }
        ]
      }
    ]
    `;
  }

  prompt += `
    Do not include markdown formatting. Return only the raw JSON string.
    Ensure dates are valid ISO strings.
    Create a comprehensive plan including travel to/from destination.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown formatting if the model adds it despite instructions
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const stops: GeneratedStop[] = JSON.parse(cleanedText);

    // Enrich with Google Places Data
    const enrichedStops = await Promise.all(stops.map(async (stop) => {
      if (stop.type === 'activity' || stop.type === 'meal' || stop.type === 'accommodation') {
        // Extract name from notes if possible, otherwise use notes as query
        let query = stop.notes;
        if (stop.notes.includes('Accommodation:')) {
          query = stop.notes.replace('Accommodation:', '').trim();
        }

        // Add city context if available to improve search accuracy
        // (This is a simplified approach; ideally we'd track current city)

        const placeId = await searchPlace(query);
        if (placeId) {
          const details = await getPlaceDetails(placeId);
          if (details) {
            return {
              ...stop,
              image_url: details.photoUrl || undefined,
              rating: details.rating,
              address: details.address
            };
          }
        }
      }
      return stop;
    }));

    return enrichedStops;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate plan');
  }
}
