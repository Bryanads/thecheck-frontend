import { useEffect, useState } from "react";
import API from "../api/api";
import CardForecast from "../components/CardForecast";

export default function Forecasts() {
  const [spots, setSpots] = useState([]);
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar lista de spots ao montar
  useEffect(() => {
    API.get("/spots")
      .then((res) => setSpots(res.data))
      .catch(() => setError("Erro ao carregar spots"));
  }, []);

  const handleSubmit = async () => {
    if (selectedSpots.length === 0) {
      setError("Selecione pelo menos um spot.");
      return;
    }

    setLoading(true);
    setError(null);
    setForecastData([]);

    try {
      const res = await API.post("/forecasts", {
        spot_ids: selectedSpots.map((id) => Number(id)),
        day_offset: [Number(dayOffset)]
      });
      setForecastData(res.data);
    } catch (err) {
      setError("Erro ao buscar previsões.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Previsões Detalhadas</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block mb-1">Selecione os Spots:</label>
          <select
            multiple
            className="w-full border p-2 h-32"
            value={selectedSpots}
            onChange={(e) =>
              setSelectedSpots(Array.from(e.target.selectedOptions, (o) => o.value))
            }
          >
            {spots.map((spot) => (
              <option key={spot.spot_id} value={spot.spot_id}>
                {spot.spot_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Dia:</label>
          <select
            className="w-full border p-2"
            value={dayOffset}
            onChange={(e) => setDayOffset(e.target.value)}
          >
            <option value="0">Hoje</option>
            <option value="1">Amanhã</option>
            <option value="2">Depois de Amanhã</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Buscar Previsões"}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-2 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecastData.map((item, i) => (
          <CardForecast key={i} data={item} />
        ))}
      </div>
    </div>
  );
}
