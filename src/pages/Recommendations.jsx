import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../auth/AuthProvider";
import SpotRecommendationsGroup from '../components/SpotRecommendationsGroup';

export default function Recommendations() {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [selectedSpots, setSelectedSpots] = useState(() => {
    const savedSpots = sessionStorage.getItem('selectedSpots');
    return savedSpots ? JSON.parse(savedSpots) : [];
  });
  const [selectedDays, setSelectedDays] = useState(() => {
    const savedDays = sessionStorage.getItem('selectedDays');
    return savedDays ? JSON.parse(savedDays) : ["0"];
  });
  const [startTime, setStartTime] = useState(() => {
    return sessionStorage.getItem('startTime') || "08:00"; // Stores local time
  });
  const [endTime, setEndTime] = useState(() => {
    return sessionStorage.getItem('endTime') || "12:00"; // Stores local time
  });

  const [recommendations, setRecommendations] = useState(() => {
    const savedRecommendations = sessionStorage.getItem('recommendations');
    return savedRecommendations ? JSON.parse(savedRecommendations) : {};
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isExtended, setIsExtended] = useState(false);
  const [lastSearchSummary, setLastSearchSummary] = useState(() => {
    return sessionStorage.getItem('lastSearchSummary') ? JSON.parse(sessionStorage.getItem('lastSearchSummary')) : null;
  });

  useEffect(() => {
    sessionStorage.setItem('selectedSpots', JSON.stringify(selectedSpots));
  }, [selectedSpots]);

  useEffect(() => {
    sessionStorage.setItem('selectedDays', JSON.stringify(selectedDays));
  }, [selectedDays]);

  useEffect(() => {
    sessionStorage.setItem('startTime', startTime);
  }, [startTime]);

  useEffect(() => {
    sessionStorage.setItem('endTime', endTime);
  }, [endTime]);

  useEffect(() => {
    if (lastSearchSummary) {
      sessionStorage.setItem('lastSearchSummary', JSON.stringify(lastSearchSummary));
    } else {
      sessionStorage.removeItem('lastSearchSummary');
    }
  }, [lastSearchSummary]);

  // New useEffect to store recommendations
  useEffect(() => {
    if (Object.keys(recommendations).length > 0) {
      sessionStorage.setItem('recommendations', JSON.stringify(recommendations));
    } else {
      sessionStorage.removeItem('recommendations');
    }
  }, [recommendations]);


  const groupRecommendations = (data) => {
    const grouped = {};
    data.forEach((spotRecs) => {
      spotRecs.forEach((recGroup) => {
        const { spot_id, spot_name, day_offset, recommendations, error } = recGroup;
        const spotKey = `${spot_id}-${spot_name}`;
        if (!grouped[day_offset]) grouped[day_offset] = {};
        if (!grouped[day_offset][spotKey]) {
          grouped[day_offset][spotKey] = { spot_name, recommendations: [], error: null };
        }
        if (error) {
          grouped[day_offset][spotKey].error = error;
        } else {
          const recs = recommendations.map(rec => ({ ...rec, spot_id, spot_name, day_offset }));
          grouped[day_offset][spotKey].recommendations.push(...recs);
        }
      });
    });
    return grouped;
  };

  useEffect(() => {
    API.get("/spots")
      .then((res) => setSpots(res.data))
      .catch(() => setError("Erro ao carregar spots."));
  }, []);

  const handleDayChange = (e) => {
    const value = e.target.value;
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

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
      switch (offset) {
        case "0": return "Hoje";
        case "1": return "Amanhã";
        case "2": return "Depois de Amanhã";
        default: return `Dia +${offset}`;
      }
    }).join(', ');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setRecommendations({}); // Clear previous recommendations when a new search starts

    if (!user?.user_id) {
      setError("Usuário não logado ou ID de usuário ausente.");
      setLoading(false);
      return;
    }

    if (selectedSpots.length === 0) {
      setError("Por favor, selecione pelo menos um spot.");
      setLoading(false);
      return;
    }

    if (selectedDays.length === 0) {
      setError("Por favor, selecione pelo menos um dia.");
      setLoading(false);
      return;
    }

    // --- Time Validation and Conversion ---
    // Validate HH:MM format rigorously
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/; // Matches exactly HH:MM, e.g., "08:00", "23:59"

    if (!timeRegex.test(startTime)) {
      setError("Formato de 'Hora Início' inválido. Use o formato HH:MM (ex: 08:30).");
      setLoading(false);
      return;
    }

    if (!timeRegex.test(endTime)) {
      setError("Formato de 'Hora Fim' inválido. Use o formato HH:MM (ex: 12:00).");
      setLoading(false);
      return;
    }

    const today = new Date(); // Use today's date for context
    const [startHour, startMinute] = startTime.split(':').map(Number); //
    const [endHour, endMinute] = endTime.split(':').map(Number); //

    // Create Date objects using today's date and the selected local time
    const startDateTimeLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMinute, 0); // Include seconds for consistency
    const endDateTimeLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMinute, 0);     // Include seconds for consistency


    const startUtc = startDateTimeLocal.toISOString().slice(11, 16);
    const endUtc = endDateTimeLocal.toISOString().slice(11, 16);     


    try {
      const res = await API.post("/recommendations", {
        user_id: user.user_id,
        spot_ids: selectedSpots.map(Number),
        day_offset: selectedDays.map(Number),
        start_time: startUtc, 
        end_time: endUtc,  
      });

      const grouped = groupRecommendations(res.data.recommendations_by_spot || []); //
      setRecommendations(grouped); //
      setLastSearchSummary({ spots: selectedSpots, days: selectedDays, startTime, endTime }); // Store local times in summary
    } catch (err) {
      console.error("Erro ao buscar recomendações:", err); //
      setError(err.response?.data?.error || "Erro ao buscar recomendações."); //
    } finally {
      setLoading(false); //
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-2xl mb-12 border border-blue-200">
        <h2 className="text-3xl font-bold text-blue-700 mb-8 border-b-4 pb-4 border-blue-200">
          Personalize Sua Busca de Surf
        </h2>

      {!isExtended && (
        <div className="mb-6 p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner text-base text-gray-800">
          <h3 className="text-lg sm:text-xl font-semibold text-blue-700 mb-4 text-center">Configurações Atuais</h3>

          {lastSearchSummary && spots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">

              {/* SPOTS */}
              <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Spots</p>
                <p className="text-base sm:text-lg font-medium mt-1">{getSpotNamesByIds(lastSearchSummary.spots)}</p>
              </div>

              {/* DIAS */}
              <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Dias</p>
                <p className="text-base sm:text-lg font-medium mt-1">{getDayLabels(lastSearchSummary.days)}</p>
              </div>

              {/* PERÍODO */}
              <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Período</p>
                <p className="text-base sm:text-lg font-medium mt-1">{lastSearchSummary.startTime} - {lastSearchSummary.endTime}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600">Nenhuma busca anterior encontrada. Clique em "Mostrar Mais Opções" para configurar.</p>
          )}
        </div>
      )}

        {isExtended && (
          <>
            <div className="mb-8">
              <label htmlFor="spots-select" className="block mb-3 text-xl font-semibold text-gray-800">Selecione os Spots:</label>
              <select
                id="spots-select"
                multiple
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition duration-300 ease-in-out shadow-inner text-base appearance-none custom-scroll-bar overflow-auto"
                value={selectedSpots}
                onChange={(e) => setSelectedSpots(Array.from(e.target.selectedOptions, (o) => o.value))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label htmlFor="start-time-input" className="block mb-2 text-lg font-semibold text-gray-800">Hora Início:</label>
                <input
                  id="start-time-input"
                  type="time"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition duration-300 ease-in-out shadow-inner text-base"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="end-time-input" className="block mb-2 text-lg font-semibold text-gray-800">Hora Fim:</label>
                <input
                  id="end-time-input"
                  type="time"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition duration-300 ease-in-out shadow-inner text-base"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
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
              "Buscar Recomendações"
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
        <p className="text-center text-blue-600 text-2xl py-6 animate-pulse">Carregando recomendações...</p>
      )}

      {!loading && Object.keys(recommendations).length === 0 && !error && (
        <p className="text-center text-gray-600 text-xl py-8 bg-white rounded-xl shadow-md border border-gray-200 animate-fade-in">
          Nenhuma recomendação encontrada para os critérios selecionados.
        </p>
      )}

      {Object.keys(recommendations)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((dayOffset) => (
          <div key={dayOffset} className="mb-12 p-8 bg-white rounded-3xl shadow-xl border border-blue-200 animate-fade-in-up">
            <h2 className="text-4xl font-extrabold text-blue-800 mb-6 border-b-4 pb-4 border-blue-200">
              {dayOffset === "0" ? "Recomendações para Hoje" : dayOffset === "1" ? "Recomendações para Amanhã" : `Recomendações para Daqui a ${dayOffset} dias`}
            </h2>

            {Object.keys(recommendations[dayOffset])
              .sort((a, b) =>
                recommendations[dayOffset][a].spot_name.localeCompare(
                  recommendations[dayOffset][b].spot_name
                )
              )
              .map((spotKey) => {
                const spotData = recommendations[dayOffset][spotKey];

                return (
                  <SpotRecommendationsGroup
                    key={spotKey}
                    spotName={spotData.spot_name}
                    recommendations={spotData.recommendations}
                    error={spotData.error}
                  />
                );
              })}
          </div>
        ))}
    </div>
  );
}