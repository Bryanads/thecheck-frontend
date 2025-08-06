import React from 'react';
import { FaWind, FaTint, FaThermometerHalf, FaCloudRain, FaSun } from 'react-icons/fa';

const ForecastCard = ({ forecast }) => {
  const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const getWaveDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const getSwellRatingColor = (rating) => {
    if (rating === undefined || rating === null) return 'bg-gray-200 text-gray-800';
    if (rating >= 4) return 'bg-blue-500 text-white';
    if (rating >= 2) return 'bg-yellow-400 text-gray-900';
    return 'bg-red-400 text-white';
  };

  const getRainIcon = (rain) => {
    if (rain === undefined || rain === null) return null;
    if (rain > 0) return <FaCloudRain className="text-blue-500" />;
    return <FaSun className="text-yellow-500" />;
  };

  const roundedTemp = forecast.temp !== undefined && forecast.temp !== null ? Math.round(forecast.temp) : 'N/A';
  const roundedSwellHeight = forecast.swell_height !== undefined && forecast.swell_height !== null ? forecast.swell_height.toFixed(1) : 'N/A';
  const roundedSwellPeriod = forecast.swell_period !== undefined && forecast.swell_period !== null ? forecast.swell_period.toFixed(1) : 'N/A';
  const roundedWindSpeed = forecast.wind_speed !== undefined && forecast.wind_speed !== null ? forecast.wind_speed.toFixed(1) : 'N/A';

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between transform transition-transform hover:scale-105 hover:shadow-lg duration-200 ease-in-out">
      <div>
        <p className="text-lg font-bold text-blue-700 mb-2">{forecast.local_date_time || 'N/A'}</p>
        <div className="text-sm text-gray-600 mb-3">
          <p className="flex items-center mb-1"><FaThermometerHalf className="mr-2 text-red-500" /> Temp: {roundedTemp}°C</p>
          <p className="flex items-center mb-1"><FaWind className="mr-2 text-green-500" /> Vento: {roundedWindSpeed} m/s {getWindDirection(forecast.wind_direction_sg)}</p> {/* Using wind_direction_sg */}
          <p className="flex items-center mb-1"><FaTint className="mr-2 text-blue-500" /> Onda: {roundedSwellHeight}m @ {roundedSwellPeriod}s {getWaveDirection(forecast.wave_direction_sg)}</p> {/* Using wave_direction_sg */}
          {forecast.rain_sg !== undefined && ( // Using rain_sg
            <p className="flex items-center mb-1">
              {getRainIcon(forecast.rain_sg)}
              <span className="ml-2">Chuva: {forecast.rain_sg.toFixed(1)} mm</span>
            </p>
          )}
        </div>
      </div>
      <div className={`mt-4 px-3 py-1 rounded-full text-center text-sm font-semibold ${getSwellRatingColor(forecast.swell_rating_sg)}`}> {/* Using swell_rating_sg */}
        Rating: {forecast.swell_rating_sg !== undefined && forecast.swell_rating_sg !== null ? forecast.swell_rating_sg : 'N/A'}
      </div>
    </div>
  );
};

export default ForecastCard;