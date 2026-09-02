import React, { useState, useEffect } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, CloudFog, CloudDrizzle, CloudSnow, CloudSun, ArrowUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const getWeatherIcon = (code, className) => {
  if (code === 0) return <Sun className={`text-yellow-500 ${className}`} />;
  if (code === 1 || code === 2) return <CloudSun className={`text-yellow-500 ${className}`} />;
  if (code === 3) return <Cloud className={`text-gray-400 ${className}`} />;
  if (code === 45 || code === 48) return <CloudFog className={`text-gray-400 ${className}`} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={`text-blue-400 ${className}`} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className={`text-blue-500 ${className}`} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <CloudSnow className={`text-blue-200 ${className}`} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={`text-purple-500 ${className}`} />;
  return <Cloud className={`text-gray-400 ${className}`} />;
};

const WeatherWidget = ({ location, isDarkMode }) => {
  const { t } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('temperature');

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`);
        const geoData = await geoRes.json();
        
        let latitude, longitude;
        if (geoData.results && geoData.results.length > 0) {
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
        } else {
          latitude = 20.9517;
          longitude = 85.0985;
        }
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherJson = await weatherRes.json();
        
        if (weatherJson.current && weatherJson.daily && weatherJson.hourly && isMounted) {
          const indices = [1, 4, 7, 10, 13, 16, 19, 22];
          const labels = ['1 AM', '4 AM', '7 AM', '10 AM', '1 PM', '4 PM', '7 PM', '10 PM'];
          
          const hourlyData = indices.map((idx, i) => ({
            label: labels[i],
            temp: Math.round(weatherJson.hourly.temperature_2m[idx]),
            precip: weatherJson.hourly.precipitation_probability[idx],
            windSpeed: Math.round(weatherJson.hourly.wind_speed_10m[idx]),
            windDir: weatherJson.hourly.wind_direction_10m[idx]
          }));

          setWeatherData({
            current: {
              temp: Math.round(weatherJson.current.temperature_2m),
              humidity: weatherJson.current.relative_humidity_2m,
              precipitation: weatherJson.current.precipitation,
              wind: Math.round(weatherJson.current.wind_speed_10m),
              weatherCode: weatherJson.current.weather_code,
              precipProb: weatherJson.daily.precipitation_probability_max[0]
            },
            hourly: hourlyData,
            daily: weatherJson.daily.time.map((time, index) => ({
              date: time,
              maxTemp: Math.round(weatherJson.daily.temperature_2m_max[index]),
              minTemp: Math.round(weatherJson.daily.temperature_2m_min[index]),
              weatherCode: weatherJson.daily.weather_code[index],
              precipProb: weatherJson.daily.precipitation_probability_max[index]
            })).slice(0, 7)
          });
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (location) fetchWeather();
    return () => { isMounted = false; };
  }, [location]);

  if (loading || !weatherData) {
    return (
      <div className={`w-full rounded-2xl border p-4 h-64 flex items-center justify-center transition-colors ${
        isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-100 text-gray-400 shadow-sm'
      }`}>
        <div className="animate-pulse font-medium">{t('loading_weather')}</div>
      </div>
    );
  }

  const getDayName = (dateString, index) => {
    if (index === 0) return t('today');
    const date = new Date(dateString);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(days[date.getDay()]);
  };

  const hourly = weatherData.hourly;
  const numPoints = hourly.length;
  const svgWidth = 400;
  const svgHeight = 70;
  const pointWidth = svgWidth / numPoints;

  const renderTempChart = () => {
    const minTemp = Math.min(...hourly.map(h => h.temp));
    const maxTemp = Math.max(...hourly.map(h => h.temp));
    const range = (maxTemp - minTemp) || 1;
    
    let points = hourly.map((h, i) => {
      const x = (i * pointWidth) + (pointWidth / 2);
      const y = 60 - ((h.temp - minTemp) / range) * 40;
      return { x, y, temp: h.temp };
    });

    points = [
      { x: 0, y: points[0].y, temp: points[0].temp },
      ...points,
      { x: svgWidth, y: points[points.length - 1].y, temp: points[points.length - 1].temp }
    ];

    const getSmoothPath = (pts) => {
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 === pts.length ? i + 1 : i + 2];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    };

    const linePath = getSmoothPath(points);
    const areaPath = `${linePath} L ${svgWidth} 60 L 0 60 Z`;

    return (
      <div className="relative w-full overflow-x-auto scrollbar-hide pt-4">
        <div className="min-w-[400px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-[70px] overflow-visible">
            <path d={areaPath} fill={isDarkMode ? "#78350f" : "#fef3c7"} opacity={isDarkMode ? "0.4" : "0.8"} />
            <line x1="0" y1="60" x2={svgWidth} y2="60" stroke={isDarkMode ? "#a16207" : "#fde047"} strokeWidth="2" />
            <path d={linePath} fill="none" stroke="#eab308" strokeWidth="2" />
            {points.slice(1, -1).map((p, i) => (
              <text key={i} x={p.x} y={p.y - 8} fontSize="12" fill={isDarkMode ? "#fef08a" : "#6b7280"} textAnchor="middle" className="font-bold">
                {p.temp}°
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderPrecipChart = () => {
    const maxPrecip = 100;
    let areaData = `M 0 ${svgHeight}`;
    let lineData = ``;
    
    hourly.forEach((h, i) => {
      const x1 = i * pointWidth;
      const x2 = (i + 1) * pointWidth;
      const y = svgHeight - (h.precip / maxPrecip) * 50;
      
      areaData += ` L ${x1} ${y} L ${x2} ${y}`;
      if (i === 0) lineData += `M ${x1} ${y} L ${x2} ${y}`;
      else lineData += ` L ${x1} ${y} L ${x2} ${y}`;
    });
    areaData += ` L ${svgWidth} ${svgHeight} Z`;

    return (
      <div className="relative w-full overflow-x-auto scrollbar-hide pt-4">
        <div className="min-w-[400px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-[70px] overflow-visible">
            <path d={areaData} fill={isDarkMode ? "#1e3a8a" : "#dbeafe"} opacity="0.8" />
            <path d={lineData} fill="none" stroke="#3b82f6" strokeWidth="2" />
            {hourly.map((h, i) => (
              h.precip > 0 && (
                <text key={i} x={(i * pointWidth) + (pointWidth / 2)} y={(svgHeight - (h.precip / 100) * 50) - 8} fontSize="11" fill={isDarkMode ? "#93c5fd" : "#2563eb"} textAnchor="middle" className="font-bold">
                  {h.precip}%
                </text>
              )
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderWindChart = () => {
    return (
      <div className="w-full overflow-x-auto scrollbar-hide pt-4">
        <div className="min-w-[400px] flex justify-between px-2 h-[70px] items-center">
          {hourly.map((h, i) => (
            <div key={i} className="flex flex-col items-center justify-center w-[50px]">
              <span className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{h.windSpeed} km/h</span>
              <ArrowUp 
                className="h-4 w-4 text-blue-400" 
                style={{ transform: `rotate(${h.windDir}deg)` }} 
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full rounded-2xl border p-4 sm:p-5 flex flex-col space-y-4 transition-colors ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700 text-white shadow-md' 
        : 'bg-white border-gray-100 text-gray-900 shadow-sm'
    }`}>
      {/* Top Section: Current Weather */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weatherData.current.weatherCode,"h-14 w-14 sm:h-16 sm:w-16 drop-shadow-sm")}
          <div className="flex flex-col">
            <div className={`text-5xl sm:text-5xl font-light tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {weatherData.current.temp}<span className={`text-4xl sm:text-4xl font-normal ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>°C</span>
            </div>
          </div>
        </div>
        <div className={`flex flex-col space-y-1 text-lg sm:text-xl text-right pt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
          <div><span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{t('precipitation')}:</span> {weatherData.current.precipProb}%</div>
          <div><span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{t('humidity')}:</span> {weatherData.current.humidity}%</div>
          <div><span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{t('wind')}:</span> {weatherData.current.wind} km/h</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex space-x-6 border-b mt-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div 
          className={`text-xl font-bold pb-2 px-1 cursor-pointer transition-colors capitalize ${
            activeTab === 'temperature' 
              ? isDarkMode ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-800 border-b-2 border-yellow-500' 
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('temperature')}
        >
          {t('temperature')}
        </div>
        <div 
          className={`text-xl font-bold pb-2 px-1 cursor-pointer transition-colors capitalize ${
            activeTab === 'precipitation' 
              ? isDarkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-800 border-b-2 border-blue-500' 
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('precipitation')}
        >
          {t('precipitation')}
        </div>
        <div 
          className={`text-xl font-bold pb-2 px-1 cursor-pointer transition-colors capitalize ${
            activeTab === 'wind' 
              ? isDarkMode ? 'text-slate-200 border-b-2 border-slate-300' : 'text-gray-800 border-b-2 border-gray-400' 
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('wind')}
        >
          {t('wind')}
        </div>
      </div>

      {/* Hourly Data Visualization */}
      <div className="w-full">
        {activeTab === 'temperature' && renderTempChart()}
        {activeTab === 'precipitation' && renderPrecipChart()}
        {activeTab === 'wind' && renderWindChart()}
        
        {/* X-Axis Labels (Time) */}
        <div className={`w-full overflow-x-auto scrollbar-hide border-t pt-2 mt-1 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className="min-w-[400px] flex justify-between px-2">
            {hourly.map((h, i) => (
              <div key={i} className={`text-base font-semibold w-[50px] text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {h.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: 7-Day Forecast */}
      <div className={`flex overflow-x-auto pt-2 pb-1 space-x-4 sm:space-x-6 scrollbar-hide border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
        {weatherData.daily.map((day, index) => (
          <div key={day.date} className="flex flex-col items-center min-w-[3.5rem]">
            <span className={`text-lg font-semibold mb-2 capitalize ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              {getDayName(day.date, index)}
            </span>
            {getWeatherIcon(day.weatherCode,"h-6 w-6 mb-2")}
            <div className="flex items-center space-x-1 text-lg">
              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{day.maxTemp}°</span>
              <span className={isDarkMode ? 'text-slate-400' : 'text-gray-400'}>{day.minTemp}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
