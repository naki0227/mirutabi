const city = 'Tokyo';
const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`;

console.log(`Fetching: ${geoUrl}`);

fetch(geoUrl)
    .then(res => res.json())
    .then(geoData => {
        console.log('Geo Data:', JSON.stringify(geoData, null, 2));
        if (geoData.results && geoData.results.length > 0) {
            const { latitude, longitude } = geoData.results[0];
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
            console.log(`Fetching: ${weatherUrl}`);
            return fetch(weatherUrl).then(res => res.json());
        }
    })
    .then(weatherData => {
        console.log('Weather Data:', JSON.stringify(weatherData, null, 2));
    })
    .catch(err => console.error('Error:', err));
