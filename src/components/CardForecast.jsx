export default function CardForecast({ data }) {
  return (
    <div className="border p-4 rounded shadow-sm bg-white">
      <h3 className="font-bold text-lg mb-2">{data.spot_name}</h3>
      <p><strong>Horário:</strong> {data.local_time}</p>
      <p><strong>Onda:</strong> {data.wave_height_sg} m, {data.wave_direction_sg}</p>
      <p><strong>Swell:</strong> {data.swell_height_sg} m, {data.swell_direction_sg}</p>
      <p><strong>Vento:</strong> {data.wind_speed_sg} km/h, {data.wind_direction_sg}</p>
      <p><strong>Temperatura:</strong> Ar: {data.air_temperature_sg} °C, Água: {data.water_temperature_sg} °C</p>
      <p><strong>Maré:</strong> {data.tide_phase} — {data.sea_level_sg} m</p>
    </div>
  );
}
