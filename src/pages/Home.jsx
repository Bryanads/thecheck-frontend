import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import RecommendationsGroup from '../components/RecommendationsGroup';

const groupRecommendations = (recs) => {
    const grouped = {};
    if (!recs) return grouped;

    recs.forEach(rec => {
        const spotKey = `${rec.spot_id}-${rec.spot_name}`;
        const dayOffset = rec.day_offset !== undefined ? rec.day_offset : 0;

        if (!grouped[dayOffset]) {
            grouped[dayOffset] = {};
        }
        if (!grouped[dayOffset][spotKey]) {
            grouped[dayOffset][spotKey] = {
                spot_name: rec.spot_name,
                recommendations: []
            };
        }
        grouped[dayOffset][spotKey].recommendations.push(rec);
    });

    return grouped;
};

// Função auxiliar para formatar a data
const getDisplayDate = (dayOffset) => {
    const today = new Date();
    today.setDate(today.getDate() + dayOffset);
    const options = { weekday: 'long', month: 'numeric', day: 'numeric' };

    if (dayOffset === 0) {
        // Formato para "Hoje - DD/MM"
        return "Hoje - " + today.toLocaleDateString('pt-BR', {month: 'numeric', day: 'numeric'});
    } else if (dayOffset === 1) {
        // Formato para "Amanhã - DD/MM"
        return "Amanhã - " + today.toLocaleDateString('pt-BR', {month: 'numeric', day: 'numeric'});
    } else {
        // Formato para "Dia da Semana - DD/MM" para outros dias
        return today.toLocaleDateString('pt-BR', options);
    }
};


function Home() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rawRecommendations, setRawRecommendations] = useState(null);
    const [defaultPresetName, setDefaultPresetName] = useState("seu preset padrão");

    const groupedRecommendations = useMemo(() => groupRecommendations(rawRecommendations), [rawRecommendations]);

    const fetchAndSetRecommendations = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const defaultPresetResponse = await API.get(`/presets/default`, {
                params: { user_id: userId }
            });

            if (defaultPresetResponse.data && defaultPresetResponse.data.preset_id) {
                const preset = defaultPresetResponse.data;
                setDefaultPresetName(preset.preset_name);

                const formattedStartTime = preset.start_time.substring(0, 5);
                const formattedEndTime = preset.end_time.substring(0, 5);

                const recommendationData = {
                    user_id: userId,
                    spot_ids: preset.spot_ids,
                    day_offset: Array.isArray(preset.day_offset_default) ? preset.day_offset_default : [preset.day_offset_default],
                    start_time: formattedStartTime,
                    end_time: formattedEndTime,
                };

                const fetchedRecommendations = await API.post(`/recommendations`, recommendationData);

                let allFlatRecommendations = [];
                if (fetchedRecommendations.data && Array.isArray(fetchedRecommendations.data.recommendations_by_spot)) {
                    fetchedRecommendations.data.recommendations_by_spot.forEach(spotGroup => {
                        if (Array.isArray(spotGroup)) {
                            spotGroup.forEach(spotData => {
                                if (spotData && Array.isArray(spotData.recommendations)) {
                                    const spotName = spotData.spot_name;
                                    const spotId = spotData.spot_id;
                                    const dayOffset = spotData.day_offset;

                                    spotData.recommendations.forEach(rec => {
                                        allFlatRecommendations.push({
                                            ...rec,
                                            spot_id: spotId,
                                            spot_name: spotName,
                                            day_offset: dayOffset
                                        });
                                    });
                                }
                            });
                        }
                    });
                }

                sessionStorage.setItem(`recommendations_for_${userId}`, JSON.stringify(allFlatRecommendations));
                sessionStorage.setItem(`default_preset_name_for_${userId}`, preset.preset_name);

                setRawRecommendations(allFlatRecommendations);
            } else {
                setRawRecommendations([]);
                setError("Nenhum preset padrão encontrado. Por favor, crie um nas configurações de preset.");
                sessionStorage.removeItem(`recommendations_for_${userId}`);
                sessionStorage.removeItem(`default_preset_name_for_${userId}`);
            }
        } catch (err) {
            console.error("Erro ao carregar recomendações:", err);
            setError("Falha ao carregar recomendações. Tente novamente mais tarde.");
            sessionStorage.removeItem(`recommendations_for_${userId}`);
            sessionStorage.removeItem(`default_preset_name_for_${userId}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        if (!user || !user.user_id) {
            setError("Usuário não autenticado. Por favor, faça login.");
            setLoading(false);
            return;
        }

        const storedRecommendations = sessionStorage.getItem(`recommendations_for_${user.user_id}`);
        const storedPresetName = sessionStorage.getItem(`default_preset_name_for_${user.user_id}`);

        if (storedRecommendations && storedPresetName) {
            setRawRecommendations(JSON.parse(storedRecommendations));
            setDefaultPresetName(storedPresetName);
            setLoading(false);
        } else {
            fetchAndSetRecommendations(user.user_id);
        }
    }, [user, authLoading, fetchAndSetRecommendations]);

    const handleReloadRecommendations = () => {
        if (user && user.user_id) {
            sessionStorage.removeItem(`recommendations_for_${user.user_id}`);
            sessionStorage.removeItem(`default_preset_name_for_${user.user_id}`);
            fetchAndSetRecommendations(user.user_id);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mt-5 text-center">
                <p>Carregando informações...</p>
            </div>
        );
    }

    // Obter os dayOffsets e ordená-los
    const sortedDayOffsets = Object.keys(groupedRecommendations).sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Boas-vindas, {user?.name || 'Visitante'}!</h1>

            {error && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 border border-red-300">
                    {error}
                </div>
            )}

            {!user && (
                <div className="bg-blue-50 rounded p-6 text-center mt-10 shadow">
                    <p className="text-lg mb-4">
                        Descubra os melhores picos para surfar com base nas suas preferências e nas condições do mar!
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">Login</Link>
                        <Link to="/register" className="border border-blue-600 text-blue-600 px-5 py-2 rounded hover:bg-blue-100">Criar Conta</Link>
                    </div>
                </div>
            )}

            {user && (
                <>
                    <p className="text-gray-700 mt-2 mb-6">
                        Aqui estão suas recomendações baseadas no preset: <span className="font-semibold text-blue-800">{defaultPresetName}</span>
                    </p>

                    {Object.keys(groupedRecommendations).length === 0 && !error && (
                        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-4 border border-yellow-300">
                            Nenhuma recomendação encontrada para o seu preset padrão. Tente ajustar suas configurações de preset.
                        </div>
                    )}

                    {/* Loop pelos dias */}
                    {sortedDayOffsets.map(dayOffset => (
                        <div key={dayOffset} className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
                            <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">
                                {getDisplayDate(parseInt(dayOffset))}
                            </h2>
                            {/* Loop pelos spots dentro de cada dia */}
                            {Object.keys(groupedRecommendations[dayOffset])
                                .sort((a, b) => groupedRecommendations[dayOffset][a].spot_name.localeCompare(groupedRecommendations[dayOffset][b].spot_name))
                                .map(spotKey => {
                                    const spotData = groupedRecommendations[dayOffset][spotKey];
                                    return (
                                        <RecommendationsGroup
                                            key={spotKey}
                                            spotName={spotData.spot_name}
                                            recommendations={spotData.recommendations}
                                            error={spotData.error} // Passa o erro se existir
                                        />
                                    );
                                })}
                        </div>
                    ))}

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/recommendations')}
                            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
                        >
                            Ver Recomendações Personalizadas
                        </button>
                        <button
                            onClick={() => navigate('/presets')}
                            className="bg-white text-blue-700 border border-blue-700 px-6 py-2 rounded hover:bg-blue-100"
                        >
                            Gerenciar Meus Presets
                        </button>
                        <button
                            onClick={handleReloadRecommendations}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
                        >
                            Recarregar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Home;