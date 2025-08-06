import React, { useState } from 'react';
import RecommendationCard from './RecommendationCard';
import { format } from 'date-fns'; 
import { ptBR } from 'date-fns/locale'; 

function formatTime(isoDate) {
    try {
        const date = new Date(isoDate);
        return format(date, 'HH:mm', { locale: ptBR });
    } catch (error) {
        console.error("Erro ao formatar a data:", error);
        return "Horário Inválido";
    }
}

export default function SpotRecommendationsGroup({ spotName, recommendations, error }) {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => setExpanded((prev) => !prev);

    const calculateAverageScore = () => {
        if (!recommendations || recommendations.length === 0) {
            return null;
        }
        const totalScore = recommendations.reduce((sum, rec) => sum + (rec.suitability_score || 0), 0);
        return totalScore / recommendations.length;
    };

    const averageScore = calculateAverageScore();

    const getQualitativeRating = (score) => {
        if (score === null) return "Sem dados";
        if (score >= 95) return "Clássico";
        if (score >= 75) return "Muito Bom";
        if (score >= 60) return "Bom";
        if (score >= 40) return "Surfável";
        if (score >= 30) return "Ruim";
        return "Muito Ruim";
    };

    const getScoreColorClass = (score) => {
        if (score === null) return 'text-gray-500';
        if (score >= 95) return 'text-purple-700'; 
        if (score >= 75) return 'text-green-800'; 
        if (score >= 60) return 'text-blue-400';   
        if (score >= 40) return 'text-yellow-600'; 
        if (score >= 30) return 'text-orange-600'; 
        return 'text-red-600';                     
    };

    const qualitativeRating = getQualitativeRating(averageScore);
    const scoreColor = getScoreColorClass(averageScore);

    const sortedRecommendations = recommendations.length > 0
        ? [...recommendations].sort((a, b) => new Date(a.local_time) - new Date(b.local_time))
        : [];

    const firstRecommendationTime = sortedRecommendations.length > 0
        ? formatTime(sortedRecommendations[0].local_time)
        : 'N/A';
    const lastRecommendationTime = sortedRecommendations.length > 0
        ? formatTime(sortedRecommendations[sortedRecommendations.length - 1].local_time)
        : 'N/A';

    return (
        <div
            className="mb-8 border-l-4 border-blue-600 bg-white rounded shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg"
            onClick={() => {
                if (!expanded) toggleExpanded(); // Só expande ao clicar no card inteiro
            }}
        >
            {/* Cabeçalho do Spot */}
            <div
                className="bg-blue-100 px-4 py-2 rounded-t text-blue-800 font-semibold text-lg border-b border-blue-200 flex justify-between items-center cursor-pointer hover:bg-blue-200 transition"
                onClick={(e) => {
                    e.stopPropagation(); // Impede o clique no card de ser acionado
                    toggleExpanded();    // Alterna o estado (expande ou contrai)
                }}
            >
                <span>{spotName}</span>
                <span className="text-sm text-gray-600">
                    {expanded ? "⮝" : "⮟"}
                </span>
            </div>

            {error ? (
                <div className="p-4 text-red-600">Erro: {error}</div>
            ) : recommendations.length === 0 ? (
                <div className="p-4 text-gray-500">Nenhuma recomendação disponível.</div>
            ) : (
                <>
                    {!expanded ? (
                        <div className="p-4 text-center">
                            <p className={`text-4xl font-extrabold ${scoreColor} mt-2`}>
                                {qualitativeRating}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {sortedRecommendations.length > 0 ?
                                    `Entre ${firstRecommendationTime} e ${lastRecommendationTime}` :
                                    `Nenhuma recomendação disponível para este spot.`}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendations
                                .sort((a, b) => (b.suitability_score || 0) - (a.suitability_score || 0))
                                .map((rec, idx) => (
                                    <RecommendationCard key={idx} recommendation={rec} />
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
