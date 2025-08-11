// src/components/Recommendations/RecommendationCard.jsx

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Funções Auxiliares (estas são as que formatam os scores e direções) ---

const formatTime = (isoDate) => {
    try {
        const date = new Date(isoDate);
        return format(date, 'HH:mm', { locale: ptBR });
    } catch (error) {
        console.error("Erro ao formatar a data:", error);
        return "Horário Inválido";
    }
};

const formatDetailedScore = (score, isSwellImpact = false) => {
    if (typeof score === 'number' && !isNaN(score)) {
        // Multiplica por 100 e arredonda para o número inteiro mais próximo
        const displayScore = (score * 100).toFixed(0);
        return `${displayScore}/100`; // Sempre sobre 100 agora
    }
    return 'N/A'; // Se não for um número válido (ex: null, undefined)
};

const getDirectionAbbreviation = (degrees) => {
    if (typeof degrees !== 'number' || isNaN(degrees)) {
        return 'N/A';
    }
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / (360 / directions.length)) % directions.length;
    return directions[index < 0 ? index + directions.length : index];
};

// --- Componente RecommendationCard ---

export default function RecommendationCard({ recommendation }) {
    if (!recommendation) {
        return null;
    }

    const {
        suitability_score,
        forecast_conditions,
        detailed_scores,
        local_time,
        tide_info,
        preferences_used
    } = recommendation;

    const displaySuitabilityScore = (suitability_score * 100).toFixed(0);

    // Funções para definir cor e rating qualitativo (podem ser as mesmas do RecommendationsGroup)
    const getQualitativeRating = (score) => {
        if (score === null || isNaN(score)) return "Sem dados";
        if (score >= 95) return "Clássico 💎";
        if (score >= 75) return "Muito Bom 🔥";
        if (score >= 60) return "Bom 👍";
        if (score >= 40) return "Surfável 🤙";
        if (score >= 30) return "Ruim 👎";
        return "Muito Ruim 🤦";
    };

    const getScoreColorClass = (score) => {
        if (score === null || isNaN(score)) return 'text-gray-500';
        if (score >= 95) return 'text-purple-700';
        if (score >= 75) return 'text-green-800';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        if (score >= 30) return 'text-orange-600';
        return 'text-red-600';
    };

    const qualitativeRating = getQualitativeRating(parseFloat(displaySuitabilityScore));
    const scoreColor = getScoreColorClass(parseFloat(displaySuitabilityScore));

    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
            <h4 className="text-xl font-bold mb-3 text-blue-800">{formatTime(local_time)}</h4>

            {/* Score Geral e Rating Qualitativo */}
            <div className="flex items-baseline mb-3">
                <span className={`text-3xl font-extrabold mr-2 ${scoreColor}`}>
                    {displaySuitabilityScore}
                </span>
                <span className={`text-lg font-semibold ${scoreColor}`}>
                    {qualitativeRating}
                </span>
            </div>

            {/* Detalhes da Previsão */}
            <div className="mb-4 text-gray-700 text-sm flex-grow">
                <p><strong>Ondulação:</strong> {forecast_conditions.swell_height_sg}m ({forecast_conditions.swell_period_sg}s) de {getDirectionAbbreviation(parseFloat(forecast_conditions.swell_direction_sg))} <span className="inline-block transform rotate-90 text-xl leading-none">↓</span></p>
                {forecast_conditions.secondary_swell_height_sg && (
                    <p className="text-xs italic ml-4">
                        Ond. Sec.: {forecast_conditions.secondary_swell_height_sg}m ({forecast_conditions.secondary_swell_period_sg}s) de {getDirectionAbbreviation(parseFloat(forecast_conditions.secondary_swell_direction_sg))}
                    </p>
                )}
                <p><strong>Vento:</strong> {forecast_conditions.wind_speed_sg} m/s de {getDirectionAbbreviation(parseFloat(forecast_conditions.wind_direction_sg))} <span className="inline-block transform -rotate-45 text-xl leading-none">➔</span></p>
                <p><strong>Maré:</strong> {tide_info.tide_phase} ({tide_info.sea_level_sg}m)</p>
                <p><strong>Temp. Ar:</strong> {forecast_conditions.air_temperature_sg}°C</p>
                <p><strong>Temp. Água:</strong> {forecast_conditions.water_temperature_sg}°C</p>
            </div>

            {/* Scores Detalhados */}
            {detailed_scores && (
                <div className="mt-auto pt-3 border-t border-gray-200">
                    <h5 className="font-bold text-gray-800 mb-2 text-sm">Scores Detalhados:</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>Altura Onda: {formatDetailedScore(detailed_scores.wave_height_score)}</li>
                        <li>Período Onda: {formatDetailedScore(detailed_scores.swell_period_score)}</li>
                        <li>Direção Onda: {formatDetailedScore(detailed_scores.swell_direction_score)}</li>
                        <li>Vento: {formatDetailedScore(detailed_scores.wind_score)}</li>
                        <li>Maré: {formatDetailedScore(detailed_scores.tide_score)}</li>
                        <li>Temp. Ar: {formatDetailedScore(detailed_scores.air_temperature_score)}</li>
                        <li>Temp. Água: {formatDetailedScore(detailed_scores.water_temperature_score)}</li>
                        {/* Secondary Swell Impact - Tratamento especial para o range -100 a 100 */}
                        {detailed_scores.secondary_swell_impact !== undefined && (
                            <li>
                                Impacto Ond. Sec.: {formatDetailedScore(detailed_scores.secondary_swell_impact, true)}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}