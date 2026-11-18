import { useState, useEffect, useCallback } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Thermometer, Sunrise, Sunset, MapPin, RefreshCw, Waves, AlertTriangle } from 'lucide-react';
import { fetchForecasts, fetchSurf, fetchTides } from './utils/weatherApi';

const REFRESH_MS = 15 * 60 * 1000;

// San Diego locations with coordinates
const SD_LOCATIONS = [
    { name: 'Downtown', lat: 32.7157, lon: -117.1611 },
    { name: 'Clairemont', lat: 32.8322, lon: -117.1936 },
    { name: 'La Jolla', lat: 32.8328, lon: -117.2713 },
    { name: 'Mission Valley', lat: 32.7680, lon: -117.1543 },
    { name: 'Chula Vista', lat: 32.6401, lon: -117.0842 },
    { name: 'Oceanside', lat: 33.1959, lon: -117.3795 },
];

// Surf spot locations
const SURF_LOCATIONS = [
    { name: 'Ocean Beach', lat: 32.75, lon: -117.25 },
    { name: 'Pacific Beach', lat: 32.80, lon: -117.26 },
    { name: 'La Jolla', lat: 32.85, lon: -117.27 },
    { name: 'Del Mar', lat: 32.96, lon: -117.27 },
    { name: 'Oceanside', lat: 33.19, lon: -117.39 },
];

// Weather code to icon and description mapping
const getWeatherInfo = (code) => {
    const weatherCodes = {
        0: { icon: Sun, label: 'Clear sky', color: 'text-yellow-400' },
        1: { icon: Sun, label: 'Mainly clear', color: 'text-yellow-400' },
        2: { icon: Cloud, label: 'Partly cloudy', color: 'text-gray-300' },
        3: { icon: Cloud, label: 'Overcast', color: 'text-gray-400' },
        45: { icon: CloudFog, label: 'Foggy', color: 'text-gray-400' },
        48: { icon: CloudFog, label: 'Rime fog', color: 'text-gray-400' },
        51: { icon: CloudRain, label: 'Light drizzle', color: 'text-blue-300' },
        53: { icon: CloudRain, label: 'Drizzle', color: 'text-blue-400' },
        55: { icon: CloudRain, label: 'Dense drizzle', color: 'text-blue-500' },
        61: { icon: CloudRain, label: 'Light rain', color: 'text-blue-400' },
        63: { icon: CloudRain, label: 'Rain', color: 'text-blue-500' },
        65: { icon: CloudRain, label: 'Heavy rain', color: 'text-blue-600' },
        80: { icon: CloudRain, label: 'Showers', color: 'text-blue-400' },
        81: { icon: CloudRain, label: 'Moderate showers', color: 'text-blue-500' },
        82: { icon: CloudRain, label: 'Violent showers', color: 'text-blue-600' },
        56: { icon: CloudRain, label: 'Freezing drizzle', color: 'text-blue-300' },
        57: { icon: CloudRain, label: 'Freezing drizzle', color: 'text-blue-400' },
        66: { icon: CloudRain, label: 'Freezing rain', color: 'text-blue-400' },
        67: { icon: CloudRain, label: 'Freezing rain', color: 'text-blue-500' },
        71: { icon: CloudSnow, label: 'Light snow', color: 'text-slate-200' },
        73: { icon: CloudSnow, label: 'Snow', color: 'text-slate-200' },
        75: { icon: CloudSnow, label: 'Heavy snow', color: 'text-slate-100' },
        77: { icon: CloudSnow, label: 'Snow grains', color: 'text-slate-200' },
        85: { icon: CloudSnow, label: 'Snow showers', color: 'text-slate-200' },
        86: { icon: CloudSnow, label: 'Heavy snow showers', color: 'text-slate-100' },
        95: { icon: CloudLightning, label: 'Thunderstorm', color: 'text-purple-400' },
        96: { icon: CloudLightning, label: 'Thunderstorm w/ hail', color: 'text-purple-400' },
        99: { icon: CloudLightning, label: 'Severe thunderstorm', color: 'text-purple-500' },
    };
    if (code === null || code === undefined) return { icon: Cloud, label: '—', color: 'text-gray-500' };
    return weatherCodes[code] || { icon: Cloud, label: 'Unknown', color: 'text-gray-400' };
};

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Format temperature ("--" when missing instead of NaN or a made-up value)
const formatTemp = (temp) => (isNum(temp) ? `${Math.round(temp)}°` : '--');

// Get time of day for gradient
const getTimeGradient = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'from-orange-900/30 via-yellow-900/20 to-blue-900/30'; // Morning
    if (hour >= 12 && hour < 17) return 'from-blue-900/30 via-cyan-900/20 to-blue-900/30'; // Afternoon
    if (hour >= 17 && hour < 20) return 'from-orange-900/40 via-pink-900/30 to-purple-900/30'; // Sunset
    return 'from-indigo-900/40 via-purple-900/30 to-slate-900/40'; // Night
};

function CurrentWeather({ data, location }) {
    const weatherInfo = getWeatherInfo(data?.current?.weather_code);
    const WeatherIcon = weatherInfo.icon;

    return (
        <div className={`bg-gradient-to-br ${getTimeGradient()} border border-slate-700/50 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm overflow-hidden`}>
            <div className="flex items-center gap-2 text-slate-400 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}, San Diego</span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className={`${weatherInfo.color}`}>
                        <WeatherIcon className="w-16 h-16 md:w-24 md:h-24" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-4xl md:text-6xl font-light text-white">
                            {formatTemp(data?.current?.temperature_2m)}
                        </p>
                        <p className="text-lg text-slate-300 mt-1">{weatherInfo.label}</p>
                        {isNum(data?.current?.apparent_temperature) && (
                            <p className="text-sm text-slate-500 mt-1">
                                Feels like {formatTemp(data.current.apparent_temperature)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-cyan-400" />
                        <div>
                            <p className="text-sm text-slate-400">Wind</p>
                            <p className="text-white font-medium">{isNum(data?.current?.wind_speed_10m) ? `${Math.round(data.current.wind_speed_10m)} mph` : '--'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-sm text-slate-400">Humidity</p>
                            <p className="text-white font-medium">{isNum(data?.current?.relative_humidity_2m) ? `${Math.round(data.current.relative_humidity_2m)}%` : '--'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-purple-400" />
                        <div>
                            <p className="text-sm text-slate-400">Today</p>
                            <p className="text-white font-medium">{formatTemp(data?.daily?.temperature_2m_max?.[0])} / {formatTemp(data?.daily?.temperature_2m_min?.[0])}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-orange-400" />
                        <div>
                            <p className="text-sm text-slate-400">UV Index</p>
                            <p className="text-white font-medium">{isNum(data?.daily?.uv_index_max?.[0]) ? data.daily.uv_index_max[0].toFixed(1) : '--'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HourlyForecast({ data }) {
    const currentHour = new Date().getHours();

    // Find the index that matches the current hour
    const startIndex = data?.hourly?.time?.findIndex(t => new Date(t).getHours() === currentHour) ?? -1;
    const finalStartIndex = startIndex === -1 ? 0 : startIndex;

    const hours = data?.hourly?.time?.slice(finalStartIndex, finalStartIndex + 24) || [];
    const temps = data?.hourly?.temperature_2m?.slice(finalStartIndex, finalStartIndex + 24) || [];
    const codes = data?.hourly?.weather_code?.slice(finalStartIndex, finalStartIndex + 24) || [];

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 sm:p-4 md:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Hourly Forecast</h3>
            <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-2 scrollbar-hide">
                {hours.slice(0, 12).map((time, idx) => {
                    const weatherInfo = getWeatherInfo(codes[idx]);
                    const WeatherIcon = weatherInfo.icon;
                    const hour = new Date(time).getHours();
                    const isNow = idx === 0;

                    return (
                        <div key={idx} className={`flex-shrink-0 flex flex-col items-center p-2 sm:p-3 rounded-lg min-w-[50px] sm:min-w-[60px] ${isNow ? 'bg-slate-700/50' : ''}`}>
                            <p className="text-xs text-slate-400 mb-1 sm:mb-2">
                                {isNow ? 'Now' : `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`}
                            </p>
                            <WeatherIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${weatherInfo.color} mb-1 sm:mb-2`} />
                            <p className="text-white font-medium text-sm sm:text-base">{formatTemp(temps[idx])}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DailyForecast({ data }) {
    const days = data?.daily?.time || [];
    const maxTemps = data?.daily?.temperature_2m_max || [];
    const minTemps = data?.daily?.temperature_2m_min || [];
    const codes = data?.daily?.weather_code || [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 sm:p-4 md:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">7-Day Forecast</h3>
            <div className="space-y-2 sm:space-y-3">
                {days.slice(0, 7).map((day, idx) => {
                    // Start with the date string (YYYY-MM-DD) and force local time interpretation
                    // by appending 'T00:00:00'. This ensures it's treated as local midnight,
                    // preventing timezone shifts (e.g. UTC midnight -> previous day 4PM PST).
                    const date = new Date(day + 'T00:00:00');
                    const weatherInfo = getWeatherInfo(codes[idx]);
                    const WeatherIcon = weatherInfo.icon;
                    const isToday = idx === 0;

                    return (
                        <div key={idx} className="flex items-center py-1.5 sm:py-2 border-b border-slate-700/30 last:border-0">
                            <p className={`text-xs sm:text-sm ${isToday ? 'text-white font-medium' : 'text-slate-400'} w-20 sm:w-24 flex-shrink-0`}>
                                {isToday ? 'Today' : dayNames[date.getDay()]} {date.getMonth() + 1}/{date.getDate()}
                            </p>
                            <WeatherIcon className={`w-4 h-4 ${weatherInfo.color} flex-shrink-0 mx-2`} />
                            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                <p className="text-slate-500 text-xs sm:text-sm">{formatTemp(minTemps[idx])}</p>
                                <div className="w-6 sm:w-10 h-1 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full opacity-50" />
                                <p className="text-white font-medium text-xs sm:text-sm">{formatTemp(maxTemps[idx])}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SunTimes({ data }) {
    const sunrise = data?.daily?.sunrise?.[0];
    const sunset = data?.daily?.sunset?.[0];

    const formatTime = (iso) => {
        if (!iso) return '--:--';
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="bg-gradient-to-r from-orange-900/20 to-indigo-900/20 border border-slate-700/50 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-white mb-2">Sun Schedule</h3>
            <div className="grid grid-cols-2 gap-4 relative">
                <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 bg-orange-900/30 rounded-full flex-shrink-0">
                        <Sunrise className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Rise</p>
                        <p className="text-sm font-medium text-white">{formatTime(sunrise)}</p>
                    </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-slate-700/50" />
                <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 bg-indigo-900/30 rounded-full flex-shrink-0">
                        <Sunset className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Set</p>
                        <p className="text-sm font-medium text-white">{formatTime(sunset)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TideSchedule({ tideData, failed }) {
    if (!tideData || tideData.length === 0) {
        return (
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-slate-700/50 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Tides (San Diego)</h3>
                <p className="text-xs text-slate-400">{failed ? 'Tide data unavailable right now.' : 'Loading...'}</p>
            </div>
        );
    }

    // NOAA returns "YYYY-MM-DD HH:mm" in local station time. Format it directly —
    // new Date() on that string is Invalid Date in Safari.
    const formatTideTime = (t) => {
        const [h, m] = (t.split(' ')[1] || '').split(':').map(Number);
        if (!Number.isFinite(h)) return t;
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-slate-700/50 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-white mb-2">Tides (San Diego)</h3>
            <div className="space-y-1.5">
                {tideData.slice(0, 4).map((tide, idx) => (
                    <div key={idx} className="grid grid-cols-3 items-center text-xs w-full gap-1">
                        <div className="flex items-center gap-1.5 col-span-1">
                            <Waves className={`w-3 h-3 flex-shrink-0 ${tide.type === 'H' ? 'text-cyan-400' : 'text-blue-400'}`} />
                            <span className="text-slate-400 truncate">{tide.type === 'H' ? 'High' : 'Low'}</span>
                        </div>
                        <span className="text-white font-medium text-center col-span-1">{formatTideTime(tide.t)}</span>
                        <span className="text-slate-500 text-right col-span-1">{parseFloat(tide.v).toFixed(1)} ft</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SurfForecast({ surfData, failed }) {
    const getDirectionLabel = (deg) => {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(deg / 45) % 8];
    };

    const getConditionLabel = (height) => {
        if (height < 0.5) return { label: 'Flat', color: 'text-gray-400' };
        if (height < 1) return { label: 'Small', color: 'text-blue-400' };
        if (height < 1.5) return { label: 'Fun', color: 'text-green-400' };
        if (height < 2.5) return { label: 'Good', color: 'text-yellow-400' };
        return { label: 'Big', color: 'text-orange-400' };
    };

    if (!surfData || Object.keys(surfData).length === 0) {
        return (
            <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-slate-700/50 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Surf Forecast</h3>
                <p className="text-xs text-slate-400">{failed ? 'Surf data unavailable right now.' : 'Loading...'}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
                <Waves className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">Surf Forecast</h3>
            </div>
            <div className="space-y-2">
                {SURF_LOCATIONS.map((spot) => {
                    const data = surfData[spot.name];
                    if (!data) return null;
                    const waveHeight = data.current?.wave_height || 0;
                    const wavePeriod = data.current?.wave_period || 0;
                    const waveDirection = data.current?.wave_direction || 0;
                    const condition = getConditionLabel(waveHeight);

                    return (
                        <div key={spot.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-700/30 last:border-0">
                            <span className="text-slate-300 font-medium w-20">{spot.name}</span>
                            <span className={`font-medium ${condition.color}`}>
                                {(waveHeight * 3.28).toFixed(1)}ft
                            </span>
                            <span className="text-slate-500">{wavePeriod.toFixed(0)}s</span>
                            <span className="text-slate-500">{getDirectionLabel(waveDirection)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LocationCard({ location, data, isSelected, onClick }) {
    const weatherInfo = getWeatherInfo(data?.weather_code);
    const WeatherIcon = weatherInfo.icon;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl transition-all ${isSelected
                ? 'bg-sky-900/40 border-2 border-sky-500/50'
                : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50'
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{location.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{weatherInfo.label}</p>
                </div>
                <div className="flex items-center gap-2">
                    <WeatherIcon className={`w-5 h-5 ${weatherInfo.color}`} />
                    <p className="text-lg font-medium text-white">{formatTemp(data?.temperature)}</p>
                </div>
            </div>
        </button>
    );
}

export default function WeatherDashboard() {
    const [forecasts, setForecasts] = useState([]);
    const [source, setSource] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const [tideData, setTideData] = useState([]);
    const [tideFailed, setTideFailed] = useState(false);
    const [surfData, setSurfData] = useState({});
    const [surfFailed, setSurfFailed] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(SD_LOCATIONS[0]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    // One batched forecast request covers every location, so switching
    // locations is instant and doesn't hit the API again.
    const fetchWeather = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchForecasts(SD_LOCATIONS)
                .then(({ results, source: src, warning: warn }) => {
                    setForecasts(results);
                    setSource(src);
                    setWarning(warn);
                    setError(null);
                    setLastUpdated(new Date());
                })
                .catch(err => {
                    console.error('Weather fetch error:', err);
                    setError('Live weather is temporarily unavailable from both Open-Meteo and the National Weather Service. Try refreshing in a few minutes.');
                }),
            fetchTides()
                .then(preds => { setTideData(preds); setTideFailed(false); })
                .catch(err => { console.error('Tide fetch error:', err); setTideFailed(true); }),
            fetchSurf(SURF_LOCATIONS)
                .then(map => { setSurfData(map); setSurfFailed(false); })
                .catch(err => { console.error('Surf fetch error:', err); setSurfFailed(true); }),
        ]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchWeather();
        const id = setInterval(fetchWeather, REFRESH_MS);
        return () => clearInterval(id);
    }, [fetchWeather]);

    const selectedIdx = SD_LOCATIONS.findIndex(l => l.name === selectedLocation.name);
    const weatherData = forecasts[selectedIdx] || null;
    const locationWeather = Object.fromEntries(SD_LOCATIONS.map((loc, i) => [loc.name, {
        temperature: forecasts[i]?.current?.temperature_2m,
        weather_code: forecasts[i]?.current?.weather_code,
    }]));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative w-full max-w-full md:max-w-7xl mx-auto px-2 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-900/30 rounded-lg border border-sky-800/50">
                                <Sun className="w-5 sm:w-6 h-5 sm:h-6 text-sky-400" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Weather</h1>
                        </div>
                        <p className="text-sm sm:text-base text-slate-400">San Diego • Live Conditions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchWeather}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {lastUpdated && (
                            <p className="text-xs text-slate-500">
                                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>

                {(error || warning) && (
                    <div className={`flex items-start gap-2 mb-6 px-4 py-3 rounded-lg border text-sm ${error ? 'bg-red-950/40 border-red-800/50 text-red-200' : 'bg-amber-950/30 border-amber-800/40 text-amber-200'}`}>
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error || warning}</span>
                    </div>
                )}

                {loading && !weatherData ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-2 border-sky-600 border-t-white rounded-full" />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Weather Column */}
                        <div className="lg:col-span-2 space-y-6 min-w-0">
                            <CurrentWeather data={weatherData} location={selectedLocation.name} />
                            <HourlyForecast data={weatherData} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SunTimes data={weatherData} />
                                <TideSchedule tideData={tideData} failed={tideFailed} />
                            </div>
                            <DailyForecast data={weatherData} />
                        </div>

                        {/* Locations Sidebar */}
                        <div className="space-y-4 min-w-0">
                            <h3 className="text-lg font-semibold text-white">San Diego Locations</h3>
                            <div className="space-y-3">
                                {SD_LOCATIONS.map((loc) => (
                                    <LocationCard
                                        key={loc.name}
                                        location={loc}
                                        data={locationWeather[loc.name] || {}}
                                        isSelected={selectedLocation.name === loc.name}
                                        onClick={() => setSelectedLocation(loc)}
                                    />
                                ))}
                            </div>
                            <SurfForecast surfData={surfData} failed={surfFailed} />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">Weather data from {source || 'Open-Meteo'} • Tides from NOAA • Updates every 15 minutes</p>
                </div>
            </div>
        </div>
    );
}
