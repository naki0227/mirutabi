'use server';

interface WeatherData {
    weather: string;
    temperature: string;
}

export async function getWeather(city: string): Promise<WeatherData | null> {
    console.log(`[getWeather] Fetching weather for: ${city}`);
    try {
        // 1. Geocoding to get lat/lon
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`;
        console.log(`[getWeather] Geo URL: ${geoUrl}`);
        const geoRes = await fetch(geoUrl);

        if (!geoRes.ok) {
            console.error(`[getWeather] Geo fetch failed: ${geoRes.status} ${geoRes.statusText}`);
            return null;
        }

        const geoData = await geoRes.json();
        console.log(`[getWeather] Geo Data:`, JSON.stringify(geoData));

        if (!geoData.results || geoData.results.length === 0) {
            console.warn(`[getWeather] No results found for city: ${city}`);
            return null;
        }

        const { latitude, longitude, name } = geoData.results[0];
        console.log(`[getWeather] Coordinates: ${latitude}, ${longitude} (${name})`);

        // 2. Fetch Weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
        console.log(`[getWeather] Weather URL: ${weatherUrl}`);
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            console.error(`[getWeather] Weather fetch failed: ${weatherRes.status} ${weatherRes.statusText}`);
            return null;
        }

        const weatherData = await weatherRes.json();
        console.log(`[getWeather] Weather Data:`, JSON.stringify(weatherData));

        if (!weatherData.daily) {
            console.warn(`[getWeather] No daily weather data found`);
            return null;
        }

        const code = weatherData.daily.weather_code[0];
        const maxTemp = weatherData.daily.temperature_2m_max[0];
        const minTemp = weatherData.daily.temperature_2m_min[0];

        // WMO Weather interpretation
        const weatherDesc = getWeatherDescription(code);

        return {
            weather: `${name}の天気: ${weatherDesc}`,
            temperature: `最高: ${maxTemp}°C / 最低: ${minTemp}°C`
        };

    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

function getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return '快晴 ☀️';
    if (code >= 1 && code <= 3) return '晴れ時々曇り 🌤';
    if (code >= 45 && code <= 48) return '霧 🌫';
    if (code >= 51 && code <= 55) return '霧雨 🌧';
    if (code >= 61 && code <= 65) return '雨 ☔️';
    if (code >= 71 && code <= 77) return '雪 ☃️';
    if (code >= 80 && code <= 82) return 'にわか雨 🌦';
    if (code >= 95) return '雷雨 ⚡️';
    return '曇り ☁️';
}
