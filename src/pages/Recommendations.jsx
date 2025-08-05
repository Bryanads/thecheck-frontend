import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../auth/AuthProvider";

export default function Recommendations() {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get("/spots")
      .then((res) => setSpots(res.data))
      .catch(() => setError("Erro ao carregar spots"));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      const res = await API.post("/recommendations", {
        user_id: user.user_id,
        spot_ids: selectedSpots.map(Number),
        day_offset: Number(dayOffset),
        start_time: startTime,
        end_time: endTime,
      });
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      setError("Erro ao buscar recomendações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Recomendações Personalizadas</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1">Spots:</label>
          <select
            multiple
            value={selectedSpots}
            onChange={(e) =>
              setSelectedSpots(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full border p-2 h-32"
          >
            {spots.map((spot) => (
              <option key={spot.spot_id} value={spot.spot_id}>
                {spot.spot_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1">Dia:</label>
            <select
              className="w-full border p-2"
              value={dayOffset}
              onChange={(e) => setDayOffset(e.target.value)}
            >
              <option value="0">Hoje</option>
              <option value="1">Amanhã</option>
              <option value="2">Depois de amanhã</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Horário Inicial:</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Horário Final:</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border p-2"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Buscando..." : "Buscar Recomendações"}
      </button>

      {error && <div className="bg-red-100 text-red-700 p-2 mt-4">{error}</div>}

      <div className="mt-8 space-y-6">
        {recommendations.length > 0 &&
          recommendations
            .sort((a, b) => b.suitability_score - a.suitability_score)
            .map((rec, i) => (
              <details key={i} className="border p-4 rounded bg-white">
                <summary className="cursor-pointer font-semibold">
                  {rec.spot_name} — {rec.local_time} — Score:{" "}
                  <span className="text-green-600 font-bold">
                    {Number(rec.suitability_score).toFixed(2)}
                  </span>
                </summary>
                <div className="mt-2 text-sm space-y-2">
                  <p>
                    <strong>Maré:</strong> {rec.tide_info?.tide_phase} —{" "}
                    {rec.tide_info?.sea_level_sg} m
                  </p>

                  <p>
                    <strong>Condições:</strong>
                  </p>
                  <ul className="list-disc ml-6">
                    <li>
                      Onda: {rec.forecast_conditions.wave_height_sg} m,{" "}
                      {rec.forecast_conditions.wave_direction_sg}
                    </li>
                    <li>
                      Vento: {rec.forecast_conditions.wind_speed_sg} km/h,{" "}
                      {rec.forecast_conditions.wind_direction_sg}
                    </li>
                    <li>
                      Temperatura do ar:{" "}
                      {rec.forecast_conditions.air_temperature_sg} °C
                    </li>
                    <li>
                      Temperatura da água:{" "}
                      {rec.forecast_conditions.water_temperature_sg} °C
                    </li>
                  </ul>

                  <p>
                    <strong>Scores Detalhados:</strong>
                  </p>
                  <ul className="list-disc ml-6">
                    <li>Onda (Altura Total): {rec.detailed_scores.height_total_score}</li>
                    <li>Onda (Período Total): {rec.detailed_scores.period_total_score}</li>
                    <li>Onda (Direção Total): {rec.detailed_scores.direction_total_score}</li>
                    <li>Vento: {rec.detailed_scores.wind_score}</li>
                    <li>Maré: {rec.detailed_scores.tide_score}</li>
                    <li>Corrente: {rec.detailed_scores.current_speed_score}</li>
                    <li>Impacto Swell Secundário: {rec.detailed_scores.secondary_swell_impact_score}</li>
                    <li>Temperatura do Ar: {rec.detailed_scores.air_temperature_score}</li>
                    <li>Temperatura da Água: {rec.detailed_scores.water_temperature_score}</li>
                  </ul>
                </div>
              </details>
            ))}
      </div>
    </div>
  );
}