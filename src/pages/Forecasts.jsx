import { useEffect, useState } from "react";
import API from "../api/api";
import ForecastGroup from "../components/ForecastGroup";

export default function Forecasts() {
  const [spots, setSpots] = useState([]);
  const [selectedSpots, setSelectedSpots] = useState(() => {
    const savedSpots = sessionStorage.getItem("forecastSelectedSpots");
    return savedSpots ? JSON.parse(savedSpots) : [];
  });
  const [selectedDays, setSelectedDays] = useState(() => {
    const savedDays = sessionStorage.getItem('forecastSelectedDays');
    const parsedDays = savedDays ? JSON.parse(savedDays) : ["0"];
    return parsedDays.length > 0 ? parsedDays : ["0"];
  });
  const [forecastData, setForecastData] = useState(() => {
    const savedForecastData = sessionStorage.getItem("forecastData");
    return savedForecastData ? JSON.parse(savedForecastData) : {};
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isExtended, setIsExtended] = useState(() => {
    const savedForecastData = sessionStorage.getItem('forecastData');
    const savedSpots = sessionStorage.getItem('forecastSelectedSpots');
    const hasSavedDataOrSelections = (savedForecastData && Object.keys(JSON.parse(savedForecastData)).length > 0) ||
                                     (savedSpots && JSON.parse(savedSpots).length > 0);
    return !hasSavedDataOrSelections;
  });
  const [lastSearchSummary, setLastSearchSummary] = useState(() => {
    return sessionStorage.getItem('forecastLastSearchSummary') ? JSON.parse(sessionStorage.getItem('forecastLastSearchSummary')) : null;
  });


  useEffect(() => {
    API.get("/spots")
      .then((res) => setSpots(res.data))
      .catch((err) => {
        console.error("Erro ao carregar spots:", err);
        setError("Erro ao carregar spots.");
      });
  }, []);

  useEffect(() => {
    sessionStorage.setItem("forecastSelectedSpots", JSON.stringify(selectedSpots));
  }, [selectedSpots]);

  useEffect(() => {
    sessionStorage.setItem("forecastSelectedDays", JSON.stringify(selectedDays));
  }, [selectedDays]);

  useEffect(() => {
    if (Object.keys(forecastData).length > 0) {
      sessionStorage.setItem("forecastData", JSON.stringify(forecastData));
    } else {
      sessionStorage.removeItem("forecastData");
    }
  }, [forecastData]);

  useEffect(() => {
    if (lastSearchSummary) {
      sessionStorage.setItem('forecastLastSearchSummary', JSON.stringify(lastSearchSummary));
    } else {
      sessionStorage.removeItem('forecastLastSearchSummary');
    }
  }, [lastSearchSummary]);


  const getSpotNamesByIds = (ids) => {
    if (spots.length === 0) return 'Carregando spots...';
    if (!ids || ids.length === 0) return 'Nenhum spot selecionado';
    return ids.map(id => {
      const spot = spots.find(s => s.spot_id === Number(id));
      return spot ? spot.spot_name : `Spot ID ${id}`;
    }).join(', ');
  };

  const getDayLabels = (offsets) => {
    if (!offsets || offsets.length === 0) return 'Nenhum dia selecionado';
    return offsets.map(offset => {
      // Convert offset to number to handle sorting correctly if it comes as string
      const numOffset = Number(offset);
      switch (numOffset) {
        case 0: return "Hoje";
        case 1: return "Amanhã";
        case 2: return "Depois de Amanhã";
        default: return `Dia +${numOffset}`;
      }
    }).sort((a, b) => {
      // Custom sort to ensure "Hoje", "Amanhã", "Depois de Amanhã" are first
      const getOrder = (label) => {
        if (label === "Hoje") return 0;
        if (label === "Amanhã") return 1;
        if (label === "Depois de Amanhã") return 2;
        return parseInt(label.replace('Dia +', ''), 10) || 99; // Handles "Dia +X"
      };
      return getOrder(a) - getOrder(b);
    }).join(', ');
  };

  const handleDayChange = (e) => {
    const value = e.target.value;
    setSelectedDays((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const groupForecastsBySpotConsolidated = (data) => {
    const grouped = {};
    if (!Array.isArray(data)) {
        console.error("groupForecastsBySpotConsolidated: Dados da API não são um array conforme esperado:", data);
        return grouped;
    }

    data.forEach((forecastItem) => {
      const { spot_id, spot_name, timestamp_utc, timezone } = forecastItem;

      if (timestamp_utc === undefined || timestamp_utc === null || typeof timestamp_utc !== 'string') {
          console.warn("groupForecastsBySpotConsolidated: Item de previsão ignorado por 'timestamp_utc' inválido (não é string ou está faltando). Item:", forecastItem);
          return;
      }

      const forecastDateUTC = new Date(timestamp_utc);
      if (isNaN(forecastDateUTC.getTime())) {
        console.warn("groupForecastsBySpotConsolidated: Item de previsão ignorado por 'timestamp_utc' inválido (não pôde ser parseado para data). Item:", forecastItem);
        return;
      }

      let local_time_formatted = 'N/A';
      let local_date_time_formatted = 'N/A';

      if (timezone) {
          try {
              const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: timezone
              });
              local_time_formatted = timeFormatter.format(forecastDateUTC);

              const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: timezone
              });
              local_date_time_formatted = dateTimeFormatter.format(forecastDateUTC);

          } catch (e) {
              console.error("Erro ao formatar local_time/local_date_time com timezone:", timezone, e);
              local_time_formatted = 'N/A';
              local_date_time_formatted = 'N/A';
          }
      }

      if (spot_name && spot_id !== undefined && typeof spot_id === 'number') {
        if (!grouped[spot_id]) {
          grouped[spot_id] = { spot_name, forecasts: [] };
        }
        grouped[spot_id].forecasts.push({
            ...forecastItem,
            local_time: local_time_formatted,
            local_date_time: local_date_time_formatted
        });
      } else {
          console.warn("groupForecastsBySpotConsolidated: Item de previsão ignorado por 'spot_name' ou 'spot_id' inválido. Item:", forecastItem);
      }
    });

    for (const spotId in grouped) {
        grouped[spotId].forecasts.sort((a, b) => {
            const dateA = new Date(a.timestamp_utc);
            const dateB = new Date(b.timestamp_utc);
            return dateA.getTime() - dateB.getTime();
        });
    }

    return grouped;
  };

  const handleSubmit = async () => {
    if (selectedSpots.length === 0) {
      setError("Selecione pelo menos um spot.");
      setLoading(false);
      return;
    }
    if (selectedDays.length === 0) {
      setError("Selecione pelo menos um dia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setForecastData({});

    try {
      const res = await API.post("/forecasts", {
        spot_ids: selectedSpots.map((id) => Number(id)),
        day_offset: selectedDays.map((offset) => Number(offset))
      });

      const grouped = groupForecastsBySpotConsolidated(res.data);
      setForecastData(grouped);
      setLastSearchSummary({ spots: selectedSpots, days: selectedDays });
      setIsExtended(false);
    } catch (err) {
      console.error("Erro ao buscar previsões:", err);
      setError("Erro ao buscar previsões.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8 border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 border-b-4 pb-4 border-blue-200">
          Previsões Detalhadas
        </h1>

        {!isExtended && (
          <div className="mb-6 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner text-base text-gray-800">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-700 mb-4 text-center">Configurações Atuais</h3>
            {lastSearchSummary && spots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Spots</p>
                  <p className="text-base sm:text-lg font-medium mt-1">{getSpotNamesByIds(lastSearchSummary.spots)}</p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Dias</p>
                  <p className="text-base sm:text-lg font-medium mt-1">{getDayLabels(lastSearchSummary.days)}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-600">Nenhuma busca anterior encontrada. Clique em "Editar Opções" para configurar.</p>
            )}
          </div>
        )}

        {isExtended && (
          <>
            <div className="mb-6">
              <label htmlFor="spots-select" className="block mb-2 text-xl font-semibold text-gray-800">Selecione os Spots:</label>
              <select
                id="spots-select"
                multiple
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition duration-300 ease-in-out shadow-inner text-base appearance-none custom-scroll-bar overflow-auto"
                value={selectedSpots}
                onChange={(e) =>
                  setSelectedSpots(Array.from(e.target.selectedOptions, (o) => o.value))
                }
                style={{ minHeight: '180px' }}
              >
                {spots.map((spot) => (
                  <option key={spot.spot_id} value={spot.spot_id}>
                    {spot.spot_name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-2">Dica: Segure `Ctrl` (ou `Cmd` no Mac) para selecionar múltiplos spots.</p>
            </div>

            <div className="mb-8">
              <label className="block mb-3 text-xl font-semibold text-gray-800">Selecione os Dias:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Hoje", "Amanhã", "Depois de Amanhã"].map((label, i) => (
                  <label key={i} className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="checkbox"
                      value={String(i)}
                      checked={selectedDays.includes(String(i))}
                      onChange={handleDayChange}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded-md"
                    />
                    <span className="ml-3 text-base text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold text-lg w-full sm:w-auto shadow-md transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </span>
            ) : (
              "Buscar Previsões"
            )}
          </button>

          <button
            onClick={() => setIsExtended(!isExtended)}
            className="bg-white text-blue-700 border border-blue-300 px-5 py-2 rounded-lg font-medium text-base hover:bg-blue-50 w-full sm:w-auto shadow-sm active:scale-95"
          >
            {isExtended ? "Ocultar Opções" : "Editar Opções"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-5 mb-8 rounded-lg border-2 border-red-300 flex items-center shadow-md">
          <svg className="h-8 w-8 mr-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-lg font-medium">{error}</div>
        </div>
      )}

      {loading && (
        <p className="text-center text-blue-600 text-2xl py-6 animate-pulse">Carregando previsões...</p>
      )}

      {!loading && Object.keys(forecastData).length === 0 && !error && (
        <p className="text-center text-gray-600 text-xl py-8 bg-white rounded-xl shadow-md border border-gray-200 animate-fade-in">
          Nenhuma previsão encontrada para os critérios selecionados.
        </p>
      )}

      {/* Renderização agrupada: Spot > Único Gráfico/Sessão */}
      {Object.keys(forecastData)
        .sort((a, b) => {
          const spotA = spots.find(s => s.spot_id === Number(a))?.spot_name || '';
          const spotB = spots.find(s => s.spot_id === Number(b))?.spot_name || '';
          return spotA.localeCompare(spotB);
        })
        .map((spotId) => {
          const spotGroup = forecastData[spotId];
          const allSpotForecasts = spotGroup.forecasts || []; // Defensive check

          return (
            <div key={spotId} className="mb-12 p-8 bg-white rounded-3xl shadow-xl border border-blue-200 animate-fade-in-up">
              <h2 className="text-4xl font-extrabold text-blue-800 mb-6 border-b-4 pb-4 border-blue-200">
                {spotGroup.spot_name}
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                * Previsões detalhadas geralmente disponíveis entre 05h e 17h para cada dia. O gráfico abaixo mostra a evolução ao longo dos dias selecionados.
              </p>

              <ForecastGroup
                spotName={spotGroup.spot_name}
                forecasts={allSpotForecasts}
              />
            </div>
          );
        })}
    </div>
  );
}